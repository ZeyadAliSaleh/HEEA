require('dotenv').config();
// server/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const path = require('path');
const AIAnalysisEngine = require('./ai-engine');


const multer = require('multer');
const app = express();
const PORT = 4000;

const aiEngine = new AIAnalysisEngine();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==================== FILE UPLOAD ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Images only!'));
  }
});

// Create uploads folder
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// ==================== END FILE UPLOAD ====================

// Root route - serves login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// ==================== FORMS API ====================

// GET all forms
app.get('/api/forms', async (req, res) => {
  try {
    const [forms] = await db.query('SELECT * FROM forms ORDER BY created_at DESC');
    
    // Get fields for each form
    for (let form of forms) {
      const [fields] = await db.query(
        'SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order',
        [form.id]
      );
      
      // Parse JSON options
      form.fields = fields.map(field => {
  let parsedOptions = null;
  if (field.options) {
    try {
      parsedOptions = JSON.parse(field.options);
    } catch (error) {
      console.warn(`Skipping corrupted options for field ${field.label}`);
      parsedOptions = null;
    }
  }
  return {
    ...field,
    options: parsedOptions
  };
});
    }
    
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// GET single form by ID
app.get('/api/forms/:id', async (req, res) => {
  try {
    const [forms] = await db.query('SELECT * FROM forms WHERE id = ?', [req.params.id]);
    
    if (forms.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const form = forms[0];
    const [fields] = await db.query(
      'SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order',
      [form.id]
    );
    
    form.fields = fields.map(field => {
      let parsedOptions = null;
      if (field.options) {
        try {
          // Try parsing as JSON first
          parsedOptions = JSON.parse(field.options);
        } catch (e) {
          // If it fails, it might already be an array or string
          parsedOptions = Array.isArray(field.options) ? field.options : null;
        }
      }
      return {
        ...field,
        options: parsedOptions
      };
    });
    
    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// CREATE new form
app.post('/api/forms', async (req, res) => {
  const { title, description, fields } = req.body;
  const formId = uuidv4();
  
  try {
    // Insert form
    await db.query(
      'INSERT INTO forms (id, title, description) VALUES (?, ?, ?)',
      [formId, title, description]
    );
    
    // Insert fields
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      await db.query(
        'INSERT INTO form_fields (id, form_id, label, type, field_group, required, options, accept, field_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          field.id || uuidv4(),
          formId,
          field.label,
          field.type,
          field.group || null,
          field.required || false,
          field.options ? JSON.stringify(field.options) : null,
          field.accept || null,
          i
        ]
      );
    }
    
    res.json({ id: formId, message: 'Form created successfully' });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// UPDATE form
app.put('/api/forms/:id', async (req, res) => {
  const { title, description, fields } = req.body;
  const formId = req.params.id;
  
  try {
    // Update form
    await db.query(
      'UPDATE forms SET title = ?, description = ? WHERE id = ?',
      [title, description, formId]
    );
    
    // Delete old fields
    await db.query('DELETE FROM form_fields WHERE form_id = ?', [formId]);
    
    // Insert new fields
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      await db.query(
        'INSERT INTO form_fields (id, form_id, label, type, field_group, required, options, accept, field_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          field.id || uuidv4(),
          formId,
          field.label,
          field.type,
          field.group || null,
          field.required || false,
          field.options ? JSON.stringify(field.options) : null,
          field.accept || null,
          i
        ]
      );
    }
    
    res.json({ message: 'Form updated successfully' });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// DELETE form
app.delete('/api/forms/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM forms WHERE id = ?', [req.params.id]);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// PUBLISH/UNPUBLISH form
app.patch('/api/forms/:id/publish', async (req, res) => {
  const { published } = req.body;
  const formId = req.params.id;
  
  try {
    // Check if form exists
    const [forms] = await db.query('SELECT * FROM forms WHERE id = ?', [formId]);
    
    if (forms.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Update published status
    await db.query(
      'UPDATE forms SET published = ? WHERE id = ?',
      [published ? 1 : 0, formId]
    );
    
    res.json({ 
      message: `Form ${published ? 'published' : 'unpublished'} successfully`,
      published: published
    });
  } catch (error) {
    console.error('Error updating form publish status:', error);
    res.status(500).json({ 
      error: 'Failed to update form publish status',
      message: error.message 
    });
  }
});



// ==================== SUBMISSIONS API ====================

// GET all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const [submissions] = await db.query('SELECT * FROM submissions ORDER BY submitted_at DESC');
    
    // Get submission data and AI recommendations for each submission
    for (let submission of submissions) {
      const [data] = await db.query(
        'SELECT field_label, field_value FROM submission_data WHERE submission_id = ?',
        [submission.id]
      );
      
      submission.data = {};
      data.forEach(item => {
        submission.data[item.field_label] = item.field_value;
      });
      
      // Get AI recommendation if exists
      const [aiRec] = await db.query(
        'SELECT * FROM ai_recommendations WHERE submission_id = ?',
        [submission.id]
      );
      
      if (aiRec.length > 0) {
  submission.aiRecommendation = {
    recommendation: aiRec[0].ai_decision,
    confidence: aiRec[0].ai_confidence,
    reasoning: aiRec[0].ai_reasoning,
    analysis: aiRec[0].ai_reasoning,
    finalDecision: aiRec[0].admin_decision || aiRec[0].ai_decision,
    reviewedBy: (aiRec[0].admin_decision || aiRec[0].status === 'approved') ? 'Admin' : null,
    reviewedAt: aiRec[0].updated_at,
    adminNotes: aiRec[0].admin_notes
  };
}
    }
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// GET single submission by ID (NEW - for admin-ai-review page)
app.get('/api/submissions/:id', async (req, res) => {
  try {
    console.log('Fetching submission with ID:', req.params.id);
    
    const [submissions] = await db.query(
      'SELECT * FROM submissions WHERE id = ?',
      [req.params.id]
    );
    
    if (submissions.length === 0) {
      console.log('Submission not found');
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const submission = submissions[0];
    
    // Get submission data
    const [data] = await db.query(
      'SELECT field_label, field_value FROM submission_data WHERE submission_id = ?',
      [submission.id]
    );
    
    submission.data = {};
    data.forEach(item => {
      submission.data[item.field_label] = item.field_value;
    });
    
    // Get AI recommendation
    const [aiRec] = await db.query(
      'SELECT * FROM ai_recommendations WHERE submission_id = ?',
      [submission.id]
    );
    
    if (aiRec.length > 0) {
      submission.aiRecommendation = {
        recommendation: aiRec[0].ai_decision,
        confidence: aiRec[0].ai_confidence,
        reasoning: aiRec[0].ai_reasoning,
        analysis: aiRec[0].ai_reasoning,
        finalDecision: aiRec[0].admin_decision || aiRec[0].ai_decision,
        reviewedBy: (aiRec[0].admin_decision || aiRec[0].status === 'approved') ? 'Admin' : null,
        reviewedAt: aiRec[0].updated_at,
        adminNotes: aiRec[0].admin_notes
      };
    }
    
    // Add form name
    submission.formName = submission.form_title;
    submission.submittedAt = submission.submitted_at;
    
    console.log('Submission found and formatted:', submission);
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// CREATE submission - WITH AI ANALYSIS
app.post('/api/submissions', upload.single('productImage'), async (req, res) => {
  const { formId, formTitle, data } = req.body;
  const submissionId = uuidv4();
  
  try {
    console.log('\n🤖 === AI ANALYSIS STARTING ===');
    
    // Insert submission
    await db.query(
      'INSERT INTO submissions (id, form_id, form_title) VALUES (?, ?, ?)',
      [submissionId, formId, formTitle]
    );
    
    // Insert submission data AND build data object for AI
    // Insert submission data AND build data object for AI
    const submissionDataObj = {};
    
    // Parse data properly (it comes as JSON string from FormData)
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        console.log('✅ Data parsed successfully');
      } catch (e) {
        console.error('❌ Error parsing data:', e);
        return res.status(400).json({ error: 'Invalid form data format' });
      }
    }
    
    for (let [fieldId, value] of Object.entries(parsedData)) {
      // Get field label from field_id
      const [fields] = await db.query('SELECT label FROM form_fields WHERE id = ?', [fieldId]);
      const fieldLabel = fields.length > 0 ? fields[0].label : fieldId;
      
      await db.query(
        'INSERT INTO submission_data (submission_id, field_id, field_label, field_value) VALUES (?, ?, ?, ?)',
        [submissionId, fieldId, fieldLabel, typeof value === 'object' ? JSON.stringify(value) : value]
      );
      
      // Add to AI analysis object
      submissionDataObj[fieldLabel] = value;
    }
    
    // Add image if uploaded
    if (req.file) {
      const imagePath = path.join(__dirname, '..', 'public', 'uploads', req.file.filename);
      submissionDataObj['Product Image'] = imagePath;
      console.log('📸 Image uploaded:', req.file.filename);
    }

    // ✨ RUN AI ANALYSIS
    console.log('📊 Analyzing submission data...');
    const aiAnalysis = await aiEngine.analyzeSubmission(submissionDataObj);
    
    console.log('✅ AI Analysis Complete:', aiAnalysis);
    
    // Store AI recommendation in database
    const aiRecId = uuidv4();
    await db.query(
      `INSERT INTO ai_recommendations 
      (id, submission_id, ai_decision, ai_confidence, ai_reasoning, status) 
      VALUES (?, ?, ?, ?, ?, 'pending_review')`,
      [
        aiRecId, 
        submissionId, 
        aiAnalysis.recommendation, 
        aiAnalysis.confidence, 
        aiAnalysis.reasoning
      ]
    );
    
    console.log('💾 AI Recommendation saved to database');
    console.log('🤖 === AI ANALYSIS COMPLETE ===\n');
    
    res.json({ 
      id: submissionId, 
      message: 'Submission created and analyzed successfully',
      aiAnalysis: aiAnalysis
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// UPDATE submission (handles both status updates and AI recommendations)
app.put('/api/submissions/:id', async (req, res) => {
  const submissionId = req.params.id;
  const { status, aiRecommendation, formId, formTitle, data } = req.body;
  
  try {
    console.log('\n=== UPDATE SUBMISSION ===');
    console.log('Submission ID:', submissionId);
    console.log('Has aiRecommendation:', !!aiRecommendation);
    console.log('aiRecommendation object:', JSON.stringify(aiRecommendation, null, 2));
    
    // Update submission status if provided
    if (status) {
      await db.query('UPDATE submissions SET status = ? WHERE id = ?', [status, submissionId]);
      console.log('✓ Status updated to:', status);
    }
    
    // Update AI recommendation if provided (from admin review)
    if (aiRecommendation) {
      console.log('\n--- Processing AI Recommendation ---');
      console.log('Admin Notes:', aiRecommendation.adminNotes);
      console.log('Reviewed By:', aiRecommendation.reviewedBy);
      console.log('Final Decision:', aiRecommendation.finalDecision);
      console.log('Recommendation:', aiRecommendation.recommendation);
      console.log('Confidence:', aiRecommendation.confidence);
      console.log('Reasoning:', aiRecommendation.reasoning);
      
      // Check if AI recommendation already exists
      const [existing] = await db.query(
        'SELECT id, ai_decision FROM ai_recommendations WHERE submission_id = ?',
        [submissionId]
      );
      
      console.log('Existing AI records found:', existing.length);
      
      if (existing.length > 0) {
        // Update existing AI recommendation
        console.log('Updating existing AI recommendation...');
        console.log('Existing AI decision:', existing[0].ai_decision);
        
        const adminAgreed = existing[0].ai_decision === aiRecommendation.finalDecision;
        console.log('Admin agreed with AI:', adminAgreed);
        
        const updateQuery = `UPDATE ai_recommendations 
           SET admin_decision = ?, 
               admin_notes = ?,
               admin_agreed = ?,
               status = ?
           WHERE submission_id = ?`;
        
        const updateParams = [
          aiRecommendation.finalDecision,
          aiRecommendation.adminNotes || null,
          adminAgreed ? 1 : 0,
          'approved',
          submissionId
        ];
        
        console.log('Update query:', updateQuery);
        console.log('Update params:', updateParams);
        
        await db.query(updateQuery, updateParams);
        console.log('✅ AI recommendation updated successfully');
        
        // Verify the update
        const [verify] = await db.query(
          'SELECT admin_decision, admin_notes, status FROM ai_recommendations WHERE submission_id = ?',
          [submissionId]
        );
        console.log('Verification - Updated record:', verify[0]);
        
      } else {
        // Create new AI recommendation
        console.log('Creating new AI recommendation...');
        const insertQuery = `INSERT INTO ai_recommendations 
           (id, submission_id, ai_decision, ai_confidence, ai_reasoning, admin_decision, admin_notes, admin_agreed, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const insertParams = [
          uuidv4(),
          submissionId,
          aiRecommendation.recommendation || aiRecommendation.finalDecision,
          aiRecommendation.confidence || 0,
          aiRecommendation.reasoning || 'Admin review',
          aiRecommendation.finalDecision,
          aiRecommendation.adminNotes || null,
          aiRecommendation.finalDecision === aiRecommendation.recommendation ? 1 : 0,
          'approved'
        ];
        
        console.log('Insert query:', insertQuery);
        console.log('Insert params:', insertParams);
        
        await db.query(insertQuery, insertParams);
        console.log('✅ AI recommendation created successfully');
      }
    } else {
      console.log('⚠️  No aiRecommendation found in request body');
    }
    
    console.log('=== UPDATE COMPLETE ===\n');
    
    res.json({ 
      message: 'Submission updated successfully',
      submissionId: submissionId
    });
    
  } catch (error) {
    console.error('❌ Error updating submission:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update submission', 
      details: error.message 
    });
  }
});

// ==================== ADMIN STATS API ====================

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [formsCount] = await db.query('SELECT COUNT(*) as count FROM forms');
    const [submissionsCount] = await db.query('SELECT COUNT(*) as count FROM submissions');
    const [pendingCount] = await db.query('SELECT COUNT(*) as count FROM submissions WHERE status = "pending"');
    const [acceptedCount] = await db.query('SELECT COUNT(*) as count FROM submissions WHERE status = "accepted"');
    
    res.json({
      totalForms: formsCount[0].count,
      totalSubmissions: submissionsCount[0].count,
      pendingSubmissions: pendingCount[0].count,
      acceptedSubmissions: acceptedCount[0].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==================== AI RECOMMENDATIONS API ====================

// GET all pending AI reviews
app.get('/api/ai-reviews/pending', async (req, res) => {
  try {
    const [reviews] = await db.query(`
      SELECT 
        ar.*,
        s.form_title as formTitle,
        s.submitted_at as submittedAt,
        sd.field_value as customerData
      FROM ai_recommendations ar
      JOIN submissions s ON ar.submission_id = s.id
      LEFT JOIN submission_data sd ON s.id = sd.submission_id
      WHERE ar.status = 'pending_review'
      ORDER BY ar.created_at DESC
    `);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching AI reviews:', error);
    res.status(500).json({ error: 'Failed to fetch AI reviews' });
  }
});

// GET single AI review
app.get('/api/ai-reviews/:submissionId', async (req, res) => {
  try {
    const [reviews] = await db.query(
      'SELECT * FROM ai_recommendations WHERE submission_id = ?',
      [req.params.submissionId]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({ error: 'AI review not found' });
    }
    
    res.json(reviews[0]);
  } catch (error) {
    console.error('Error fetching AI review:', error);
    res.status(500).json({ error: 'Failed to fetch AI review' });
  }
});

// CREATE AI recommendation (auto-generated after submission)
app.post('/api/ai-reviews', async (req, res) => {
  const { submissionId, aiDecision, aiConfidence, aiReasoning } = req.body;
  const reviewId = uuidv4();
  
  try {
    await db.query(
      `INSERT INTO ai_recommendations 
      (id, submission_id, ai_decision, ai_confidence, ai_reasoning, status) 
      VALUES (?, ?, ?, ?, ?, 'pending_review')`,
      [reviewId, submissionId, aiDecision, aiConfidence, aiReasoning]
    );
    
    res.json({ id: reviewId, message: 'AI recommendation created' });
  } catch (error) {
    console.error('Error creating AI recommendation:', error);
    res.status(500).json({ error: 'Failed to create AI recommendation' });
  }
});

// UPDATE admin decision
app.put('/api/ai-reviews/:id/decision', async (req, res) => {
  const { adminDecision, adminNotes, status } = req.body;
  const reviewId = req.params.id;
  
  try {
    // Get the AI decision to check if admin agreed
    const [reviews] = await db.query(
      'SELECT ai_decision FROM ai_recommendations WHERE id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    const adminAgreed = reviews[0].ai_decision === adminDecision;
    
    await db.query(
      `UPDATE ai_recommendations 
       SET admin_decision = ?, admin_notes = ?, admin_agreed = ?, status = ?
       WHERE id = ?`,
      [adminDecision, adminNotes, adminAgreed, status, reviewId]
    );
    
    res.json({ message: 'Admin decision saved successfully' });
  } catch (error) {
    console.error('Error updating admin decision:', error);
    res.status(500).json({ error: 'Failed to update decision' });
  }
});

// GET customer result
app.get('/api/customer-result/:submissionId', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        s.*,
        ar.ai_decision,
        ar.ai_confidence,
        ar.admin_decision,
        ar.admin_notes,
        ar.admin_agreed,
        ar.status
      FROM submissions s
      LEFT JOIN ai_recommendations ar ON s.id = ar.submission_id
      WHERE s.id = ?
    `, [req.params.submissionId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching customer result:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// ==================== HEALTH CHECK (NEW) ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Start server
app.listen(PORT, () => {
     console.log(`
   ╔═══════════════════════════════════════╗
   ║   Server running on port ${PORT}       ║
   ║   http://localhost:${PORT}            ║
   ║   🤖 AI Engine: ACTIVE                ║
   ╚═══════════════════════════════════════╝
     `);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin-dashboard.html`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
});