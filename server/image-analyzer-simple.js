// server/image-analyzer-simple.js
// ACTUALLY WORKING VERSION - Uses HF Serverless Inference API (Feb 2025)

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

/**
 * Image Analyzer using Hugging Face Serverless Inference API
 * Documentation: https://huggingface.co/docs/api-inference/
 * Get free API key: https://huggingface.co/settings/tokens
 */
class SimpleImageAnalyzer {
  constructor() {
    // CORRECT endpoint for HF Serverless Inference API
    // This is the endpoint that ACTUALLY works (not router.huggingface.co)
    this.apiUrl = 'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';
    
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️  WARNING: HUGGINGFACE_API_KEY not found');
      console.warn('   Get a free key at: https://huggingface.co/settings/tokens');
    }
  }

  async analyzeImage(imagePath) {
    console.log('\n🖼️  Image Analysis Starting...');
    
    if (!this.apiKey) {
      console.log('   ⚠️  Skipping - No API key configured');
      return {
        scores: { recycle: 0, repair: 0, reuse: 0, retain: 0 },
        reasoning: 'Image analysis unavailable - API key not configured',
        classifications: []
      };
    }
    
    try {
      // Read image file as binary buffer
      const imageBuffer = await fs.readFile(imagePath);
      
      console.log(`   📁 Image loaded: ${path.basename(imagePath)} (${imageBuffer.length} bytes)`);
      
      // Call HF Serverless Inference API
      // CRITICAL: Send raw binary data, NOT JSON
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.apiKey}`
          // DO NOT set Content-Type - let it be binary
        },
        body: imageBuffer  // Send RAW binary buffer
      });
      
      // Check response
      if (!response.ok) {
        const errorText = await response.text();
        
        // Model loading (first request)
        if (response.status === 503) {
          console.log('   ⏳ Model is loading (first use can take 20-30 seconds)');
          console.log('   💡 Try submitting the form again in a moment');
          return {
            scores: { recycle: 0, repair: 0, reuse: 0, retain: 0 },
            reasoning: 'Model loading - please try again in 30 seconds',
            classifications: []
          };
        }
        
        // Invalid API key
        if (response.status === 401 || response.status === 403) {
          console.error('   🔑 Invalid or missing API key');
          console.error('   Get a token at: https://huggingface.co/settings/tokens');
          return {
            scores: { recycle: 0, repair: 0, reuse: 0, retain: 0 },
            reasoning: 'Invalid API key',
            classifications: []
          };
        }
        
        console.error(`   ⚠️  API Error ${response.status}:`, errorText.substring(0, 300));
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const predictions = await response.json();
      
      // Validate response format
      if (!Array.isArray(predictions) || predictions.length === 0) {
        console.log('   ⚠️  No predictions returned from API');
        return {
          scores: { recycle: 0, repair: 0, reuse: 0, retain: 0 },
          reasoning: 'No predictions from AI',
          classifications: []
        };
      }
      
      // Log top 3 predictions
      console.log('   ✅ AI Vision detected:', predictions.slice(0, 3).map(p => 
        `${p.label} (${(p.score * 100).toFixed(1)}%)`
      ).join(', '));
      
      // Interpret the predictions
      const analysis = this.interpretPredictions(predictions);
      
      return analysis;
      
    } catch (error) {
      console.error('   ❌ Image analysis error:', error.message);
      return {
        scores: { recycle: 0, repair: 0, reuse: 0, retain: 0 },
        reasoning: 'Image analysis unavailable',
        classifications: []
      };
    }
  }

  interpretPredictions(predictions) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let reasoning = '';
    const classifications = [];

    for (const pred of predictions.slice(0, 10)) {
      const label = pred.label.toLowerCase();
      const confidence = pred.score;
      
      // Store classifications
      if (confidence > 0.01) {
        classifications.push({
          label: pred.label,
          confidence: (confidence * 100).toFixed(1) + '%'
        });
      }

      // DAMAGE DETECTION
      const damageWords = ['broken', 'damaged', 'crack', 'burnt', 'shattered', 
                          'rusted', 'corroded', 'destroyed', 'smashed', 'torn'];
      if (damageWords.some(w => label.includes(w))) {
        scores.recycle += Math.round(confidence * 12);
        reasoning += `Damage detected (${pred.label}). `;
      }
      
      // WEAR DETECTION
      const wearWords = ['old', 'worn', 'used', 'scratched', 'dirty', 'stained', 'faded'];
      if (wearWords.some(w => label.includes(w))) {
        scores.repair += Math.round(confidence * 7);
        scores.reuse += Math.round(confidence * 5);
        reasoning += `Shows wear (${pred.label}). `;
      }
      
      // GOOD CONDITION
      const goodWords = ['new', 'clean', 'pristine', 'fresh', 'unused', 'mint'];
      if (goodWords.some(w => label.includes(w))) {
        scores.retain += Math.round(confidence * 10);
        reasoning += `Good condition (${pred.label}). `;
      }

      // APPLIANCE/ELECTRONICS DETECTION
      const applianceWords = ['appliance', 'device', 'machine', 'electronic', 
                             'toaster', 'blender', 'microwave', 'oven', 'mixer',
                             'fryer', 'cooker', 'processor', 'kettle'];
      if (applianceWords.some(w => label.includes(w))) {
        scores.reuse += 3;
        scores.repair += 2;
      }
      
      // CABLE/WIRE DETECTION
      const cableWords = ['cable', 'wire', 'cord', 'plug', 'socket'];
      if (cableWords.some(w => label.includes(w))) {
        scores.repair += 5;
        reasoning += `Cable/wire visible. `;
      }
    }

    // Default scoring if nothing detected
    if (Object.values(scores).every(s => s === 0)) {
      scores.reuse += 5;
      scores.repair += 3;
      reasoning = 'Standard appliance condition. ';
    }

    // Build final reasoning
    const topLabels = classifications.slice(0, 3).map(c => c.label).join(', ');
    if (topLabels) {
      reasoning += `Detected: ${topLabels}.`;
    }

    console.log('   📊 Image scores:', scores);

    return { scores, reasoning, classifications: classifications.slice(0, 5) };
  }
}

module.exports = SimpleImageAnalyzer;