// ai-engine.js - Enhanced AI Analysis System for Product Disposal

/**
 * Enhanced AI Engine that analyzes form submissions using advanced if-conditions
 * Handles complex scenarios like repairable electrical issues, component-level analysis
 */

const SimpleImageAnalyzer = require('./image-analyzer-simple');

class AIAnalysisEngine {
  constructor() {
    // Initialize image analyzer
    this.imageAnalyzer = new SimpleImageAnalyzer();
    
    // Enhanced keyword categories with weights
    this.keywords = {
      recycle: {
    critical: ['destroyed', 'shattered', 'beyond repair', 'completely broken', 'unrepairable', 'damaged', 'totaled'],
    major: ['broken', 'cracked', 'smashed', 'fried', 'burnt', 'melted', 'corroded'],
    moderate: ['severe damage', 'water damage', 'dead', 'not working'],
    failure: ['failed', 'failure', 'stopped working', 'does not work', "doesn't work", 'stop working'],
    structural: ['leaking', 'rusted', 'warped', 'rust']
  },
  repair: {
    explicit: ['repairable', 'fixable', 'can be fixed', 'easy fix', 'minor fix'],
    issues: ['damaged cable', 'cable issue', 'wire exposed', 'battery issue', 'screen crack', 'wire'],
    conditions: ['minor damage', 'small crack', 'scratched', 'dent', 'loose', 'worn', 'scratch', 'crack', 'minor damaged'],
    malfunctions: ['malfunctioning', 'malfunction', 'unresponsive', 'error', 'error message', 'error code'],
    defects: ['defective', 'button issue', 'control issue', 'sensor issue', 'defect'],
    leaks: ['leak', 'leaks']
  },
  reuse: {
    functional: ['works fine', 'still functional', 'working condition', 'functional', 'functional/working'],
    replacement: ['old model', 'outdated', 'upgrade', 'replaced', 'no longer need', 'switched'],
    performance: ['slow performance', 'old but working', 'undercooked', 'overcooked'],
    acceptable: ['acceptable', 'okay', 'still works', 'functional but', 'function but', 'accaptable'],
    minor_issues: ['weak', 'slow', 'ineffective', 'poor performance']
  },
  retain: {
    excellent: ['excellent', 'like new', 'perfect', 'mint condition', 'pristine'],
    good: ['good condition', 'works perfectly', 'no issues', 'barely used', 'clean'],
    minor_cosmetic: ['minor cosmetic', 'cosmetic only', 'aesthetic only']
  }
    };

    this.ageThresholds = {
      retain: 1,
      reuse: 3,
      repair: 5,
      recycle: 100
    };
  }

  /**
   * Main analysis function with enhanced logic
   */
  async analyzeSubmission(submissionData) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║      🤖 AI ANALYSIS SYSTEM - STEP-BY-STEP PROCESS      ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('📋 INPUT DATA:', submissionData);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 STEP 3: Initialize Scores');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   RECYCLE: 0  |  REPAIR: 0  |  REUSE: 0  |  RETAIN: 0\n');
    const scores = {
      recycle: 0,
      repair: 0,
      reuse: 0,
      retain: 0
    };

    let reasoningParts = [];
    let criticalFactors = [];

    // 1. ANALYZE TEXT WITH WEIGHTED KEYWORDS
    const textAnalysis = this.analyzeTextContentEnhanced(submissionData);
    this.mergeScores(scores, textAnalysis.scores);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 STEP 4: Keyword Detection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Keywords found:', textAnalysis.foundKeywords || 'analyzing...');
console.log('   Scores:', scores);
console.log('');
    if (textAnalysis.reasoning) reasoningParts.push(textAnalysis.reasoning);
    if (textAnalysis.critical) criticalFactors.push(textAnalysis.critical);

    // 2. ANALYZE PRODUCT APPEARANCE
    const appearanceAnalysis = this.analyzeProductAppearance(submissionData);
    this.mergeScores(scores, appearanceAnalysis.scores);
    if (appearanceAnalysis.reasoning) reasoningParts.push(appearanceAnalysis.reasoning);

    // 3. ANALYZE FUNCTIONALITY (Mechanical + Electrical)
    const functionalityAnalysis = this.analyzeProductFunctionality(submissionData);
    this.mergeScores(scores, functionalityAnalysis.scores);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚡ STEP 5: Electrical Issues Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Analysis:', functionalityAnalysis.reasoning || 'No electrical issues');
console.log('   Scores:', scores);
console.log('');
    if (functionalityAnalysis.reasoning) reasoningParts.push(functionalityAnalysis.reasoning);
    if (functionalityAnalysis.critical) criticalFactors.push(functionalityAnalysis.critical);

    // 4. ANALYZE REPAIRABILITY
    const repairabilityAnalysis = this.analyzeRepairability(submissionData);
    this.mergeScores(scores, repairabilityAnalysis.scores);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 STEP 6: Repairability Assessment');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Analysis:', repairabilityAnalysis.reasoning || 'Not assessed');
console.log('   Scores:', scores);
console.log('');
    if (repairabilityAnalysis.reasoning) reasoningParts.push(repairabilityAnalysis.reasoning);

    // 5. ANALYZE PRODUCT AGE
    if (submissionData['Product Age'] || submissionData['Purchase Date']) {
      const ageAnalysis = this.analyzeProductAge(submissionData);
      this.mergeScores(scores, ageAnalysis.scores);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📅 STEP 7: Product Age Analysis');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Analysis:', ageAnalysis.reasoning || 'Age not provided');
console.log('   Scores:', scores);
console.log('');
      if (ageAnalysis.reasoning) reasoningParts.push(ageAnalysis.reasoning);
    }

    // 6. ANALYZE OVERALL CONDITION
    if (submissionData['Condition'] || submissionData['Product Condition']) {
      const conditionAnalysis = this.analyzeCondition(submissionData);
      this.mergeScores(scores, conditionAnalysis.scores);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 STEP 8: Overall Condition Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   Analysis:', conditionAnalysis.reasoning || 'Condition not assessed');
console.log('   Scores:', scores);
console.log('');
      if (conditionAnalysis.reasoning) reasoningParts.push(conditionAnalysis.reasoning);
    }

    // 7. ANALYZE OUTDATED STATUS
    if (submissionData['Outdated']) {
      const outdatedAnalysis = this.analyzeOutdatedStatus(submissionData);
      this.mergeScores(scores, outdatedAnalysis.scores);
      if (outdatedAnalysis.reasoning) reasoningParts.push(outdatedAnalysis.reasoning);
    }

    // 8. ANALYZE WARRANTY
    if (submissionData['Warranty Status'] || submissionData['Under Warranty']) {
      const warrantyAnalysis = this.analyzeWarranty(submissionData);
      this.mergeScores(scores, warrantyAnalysis.scores);
      if (warrantyAnalysis.reasoning) reasoningParts.push(warrantyAnalysis.reasoning);
    }

    // 9. CHECK FOR MEDIA FILES
    const mediaAnalysis = this.analyzeMediaFiles(submissionData);
    if (mediaAnalysis) reasoningParts.push(mediaAnalysis.reasoning);
    // 9. ANALYZE UPLOADED IMAGE
    if (submissionData['Product Image'] || submissionData['Product Image (Optional)']) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🖼️  STEP 9: Image Analysis (AI Vision)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const imagePath = submissionData['Product Image'] || submissionData['Product Image (Optional)'];
      
      try {
        const imageAnalysis = await this.imageAnalyzer.analyzeImage(imagePath);
        
        // Weight image scores (40%)
        const weightedScores = {
          recycle: Math.round(imageAnalysis.scores.recycle * 0.4),
          repair: Math.round(imageAnalysis.scores.repair * 0.4),
          reuse: Math.round(imageAnalysis.scores.reuse * 0.4),
          retain: Math.round(imageAnalysis.scores.retain * 0.4)
        };
        
        this.mergeScores(scores, weightedScores);
        
        console.log('   Classifications:', imageAnalysis.classifications.slice(0, 3).map(c => 
          `${c.label} (${c.confidence})`
        ).join(', '));
        console.log('   Image scores (40%):', weightedScores);
        console.log('   Total after image:', scores);
        console.log('');
        
        if (imageAnalysis.reasoning) {
          reasoningParts.push('Visual: ' + imageAnalysis.reasoning);
        }
      } catch (error) {
        console.error('   ⚠️  Error:', error.message);
        reasoningParts.push('Image analysis unavailable.');
      }
    }

    // 10. CALCULATE FINAL DECISION
    const decision = this.calculateDecision(scores);
    const confidence = this.calculateConfidence(scores, decision.recommendation);

    // Build comprehensive reasoning
    let finalReasoning = reasoningParts.filter(r => r).join(' ');
    
    // Add critical factors at the beginning if any
    if (criticalFactors.length > 0) {
      finalReasoning = criticalFactors.join(' ') + ' ' + finalReasoning;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 STEP 9: Calculate Total Scores');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   RECYCLE: ${scores.recycle}`);
console.log(`   REPAIR:  ${scores.repair}`);
console.log(`   REUSE:   ${scores.reuse}`);
console.log(`   RETAIN:  ${scores.retain}`);
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🏆 STEP 10: Determine Winner');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Winner: ${decision.recommendation.toUpperCase()} with ${decision.topScore} points`);
console.log(`   Margin: ${decision.margin} points (difference from 2nd place)`);
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎲 STEP 11: Calculate Confidence Level');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Base Confidence: ${decision.topScore}/${decision.topScore + decision.secondScore} = ${((decision.topScore / (decision.topScore + decision.secondScore)) * 100).toFixed(1)}%`);
console.log(`   Gap Bonus: ${decision.margin >= 5 ? '+15%' : '0%'} ${decision.margin >= 10 ? '+10%' : ''} ${decision.margin >= 15 ? '+5%' : ''}`);
console.log(`   Final Confidence: ${(confidence * 100).toFixed(0)}%`);
console.log('');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                    🎯 FINAL RESULTS                       ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(`   ✅ Recommendation: ${decision.recommendation.toUpperCase()}`);
console.log(`   📊 Confidence: ${(confidence * 100).toFixed(0)}%`);
console.log(`   💡 Reasoning: ${finalReasoning.substring(0, 100)}...`);
console.log('\n');

    return {
      recommendation: decision.recommendation,
      confidence: confidence,
      reasoning: finalReasoning,
      analysis: `Score breakdown - Recycle: ${scores.recycle}, Repair: ${scores.repair}, Reuse: ${scores.reuse}, Retain: ${scores.retain}. Decision margin: ${decision.margin} points.`,
      scores: scores
    };
  }

  /**
   * Enhanced text analysis with weighted keywords
   */
  analyzeTextContentEnhanced(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    const foundKeywords = { recycle: [], repair: [], reuse: [], retain: [] };
    let criticalFactor = null;

    const allText = Object.entries(data)
      .filter(([key, value]) => typeof value === 'string' && !value.includes('/uploads/'))
      .map(([key, value]) => value.toLowerCase())
      .join(' ');

    // Check critical recycle keywords first
    for (const keyword of this.keywords.recycle.critical) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.recycle += 10;  // Very high weight
        foundKeywords.recycle.push(keyword);
        criticalFactor = `Critical damage detected: "${keyword}".`;
      }
    }

    // Check major recycle keywords
    for (const keyword of this.keywords.recycle.major) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.recycle += 5;
        foundKeywords.recycle.push(keyword);
      }
    }

    // Check repair keywords with emphasis on explicit repairability
    for (const keyword of this.keywords.repair.explicit) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.repair += 6;  // High weight for explicit repair terms
        foundKeywords.repair.push(keyword);
      }
    }

    for (const keyword of this.keywords.repair.issues) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.repair += 4;
        foundKeywords.repair.push(keyword);
      }
    }

    for (const keyword of this.keywords.repair.conditions) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.repair += 3;
        foundKeywords.repair.push(keyword);
      }
    }

    // Check reuse keywords
    for (const keyword of this.keywords.reuse.functional) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.reuse += 4;
        scores.retain += 2;  // Also boosts retain
        foundKeywords.reuse.push(keyword);
      }
    }

    for (const keyword of this.keywords.reuse.replacement) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.reuse += 3;
        foundKeywords.reuse.push(keyword);
      }
    }

    // Check retain keywords
    for (const keyword of this.keywords.retain.excellent) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.retain += 6;
        foundKeywords.retain.push(keyword);
      }
    }

    for (const keyword of this.keywords.retain.good) {
      if (allText.includes(keyword.toLowerCase())) {
        scores.retain += 4;
        foundKeywords.retain.push(keyword);
      }
    }

    // Generate reasoning
    let reasoning = '';
    const sortedCategories = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0][0];

    if (foundKeywords[topCategory].length > 0) {
      const uniqueKeywords = [...new Set(foundKeywords[topCategory])].slice(0, 3);
      reasoning = `Keywords detected: "${uniqueKeywords.join(', ')}" indicate ${topCategory}.`;
    }

    return { scores, reasoning, critical: criticalFactor };
  }

  /**
   * Analyze product appearance (wear, deterioration, outdated)
   */
  analyzeProductAppearance(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let reasoning = '';

    // Check wear and tear
    const wearField = (data['Wear and tear'] || data['Wear'] || '').toLowerCase();
    
    if (wearField.includes('minor') || wearField.includes('only cable')) {
      scores.repair += 4;
      scores.retain += 2;
      reasoning = 'Minor wear detected, product largely intact.';
    } else if (wearField.includes('major') || wearField.includes('extensive')) {
      scores.recycle += 5;
      scores.repair += 2;
      reasoning = 'Extensive wear indicates significant use or damage.';
    } else if (wearField.includes('none') || wearField.includes('minimal')) {
      scores.retain += 5;
      reasoning = 'Minimal wear, product well-maintained.';
    }

    // Check visible deterioration
    const deteriorationField = (data['Visible deterioration'] || '').toLowerCase();
    
    if (deteriorationField.includes('low') || deteriorationField.includes('clean')) {
      scores.retain += 4;
      scores.reuse += 2;
      if (reasoning) reasoning += ' ';
      reasoning += 'Low deterioration, good physical condition.';
    } else if (deteriorationField.includes('high') || deteriorationField.includes('severe')) {
      scores.recycle += 5;
      if (reasoning) reasoning += ' ';
      reasoning += 'High deterioration affects product viability.';
    }

    return { scores, reasoning };
  }

  /**
   * Analyze product functionality (mechanical + electrical)
   */
  analyzeProductFunctionality(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let reasoning = '';
    let criticalFactor = null;

    const mechanicalField = (data['Mechanical issue'] || '').toLowerCase();
    const electricalField = (data['Electrical issue'] || '').toLowerCase();

    // MECHANICAL ANALYSIS
    if (mechanicalField.includes('none') || mechanicalField.includes('no issue')) {
      scores.retain += 5;
      scores.reuse += 3;
      reasoning = 'No mechanical issues, core functionality intact.';
    } else if (mechanicalField.includes('yes') || mechanicalField.includes('issue')) {
      scores.repair += 4;
      scores.recycle += 2;
      reasoning = 'Mechanical issues present.';
    }

    // ELECTRICAL ANALYSIS
    if (electricalField.includes('yes') || electricalField.includes('issue')) {
      
      // Check if it's specifically a cable/wire issue
      if (electricalField.includes('cable') || electricalField.includes('wire')) {
        scores.repair += 7;  // Strong repair recommendation for cable issues
        
        if (electricalField.includes('repairable') || electricalField.includes('but is repairable')) {
          scores.repair += 5;  // Extra boost if explicitly repairable
          criticalFactor = 'Electrical issue is confirmed repairable (cable replacement).';
        } else {
          if (reasoning) reasoning += ' ';
          reasoning += 'Cable damage detected, typically repairable component.';
        }
      } else {
        // Other electrical issues
        scores.repair += 4;
        scores.recycle += 3;
        if (reasoning) reasoning += ' ';
        reasoning += 'Electrical issue requires assessment.';
      }
    } else if (electricalField.includes('none') || electricalField.includes('no')) {
      scores.retain += 4;
    }

    // CROSS-ANALYSIS: Electrical but no mechanical = Good candidate for repair
    if ((electricalField.includes('yes') || electricalField.includes('issue')) && 
        (mechanicalField.includes('none') || mechanicalField.includes('no issue'))) {
      scores.repair += 4;
      if (!criticalFactor) {
        criticalFactor = 'Only electrical issue with intact mechanics - ideal for repair.';
      }
    }

    return { scores, reasoning, critical: criticalFactor };
  }

  /**
   * Analyze ease of repair and disassembly
   */
  analyzeRepairability(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let reasoning = '';

    // Check ease of disassembly
    const disassemblyField = (data['Ease of disassembly'] || '').toLowerCase();
    
    if (disassemblyField.includes('high') || disassemblyField.includes('easy') || 
        disassemblyField.includes('can be unplugged')) {
      scores.repair += 5;
      reasoning = 'Easy disassembly makes repair practical and cost-effective.';
    } else if (disassemblyField.includes('low') || disassemblyField.includes('difficult')) {
      scores.recycle += 3;
      scores.reuse += 2;
      reasoning = 'Difficult disassembly increases repair complexity.';
    }

    // Check component integration
    const integrationField = (data['Level of components integration'] || '').toLowerCase();
    
    if (integrationField.includes('low') || integrationField.includes('separate component')) {
      scores.repair += 4;
      if (reasoning) reasoning += ' ';
      reasoning += 'Modular design allows component-level repair.';
    } else if (integrationField.includes('high') || integrationField.includes('integrated')) {
      scores.recycle += 2;
    }

    return { scores, reasoning };
  }

  /**
   * Analyze if product is outdated
   */
  analyzeOutdatedStatus(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let reasoning = '';

    const outdatedField = (data['Outdated'] || '').toLowerCase();
    
    if (outdatedField.includes('no') || outdatedField.includes('modern') || 
        outdatedField.includes('current model')) {
      scores.retain += 4;
      scores.repair += 2;
      reasoning = 'Modern design still current, retains value.';
    } else if (outdatedField.includes('yes') || outdatedField.includes('obsolete')) {
      scores.reuse += 5;
      scores.recycle += 3;
      reasoning = 'Outdated model better suited for reuse or recycling.';
    }

    return { scores, reasoning };
  }

  /**
   * Analyze product age
   */
  analyzeProductAge(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let ageInYears = 0;
    let reasoning = '';

    const ageField = data['Product Age'] || data['Purchase Date'] || data['Age'];
    
    if (ageField) {
      const ageStr = ageField.toLowerCase();
      const yearMatch = ageStr.match(/(\d+)\s*(year|yr)/);
      const monthMatch = ageStr.match(/(\d+)\s*(month|mo)/);
      
      if (yearMatch) {
        ageInYears = parseInt(yearMatch[1]);
      } else if (monthMatch) {
        ageInYears = parseInt(monthMatch[1]) / 12;
      }

      if (ageInYears < this.ageThresholds.retain) {
        scores.retain += 5;
        reasoning = `Product age (${ageInYears} years) indicates recent purchase, high retention value.`;
      } else if (ageInYears < this.ageThresholds.reuse) {
        scores.reuse += 4;
        scores.retain += 2;
        reasoning = `Product age (${ageInYears} years) suitable for continued use or reuse.`;
      } else if (ageInYears < this.ageThresholds.repair) {
        scores.repair += 3;
        scores.reuse += 3;
        reasoning = `Product age (${ageInYears} years) at midlife, repair may extend lifespan.`;
      } else {
        scores.recycle += 5;
        reasoning = `Product age (${ageInYears} years) suggests end of useful life.`;
      }
    }

    return { scores, reasoning };
  }

  /**
   * Analyze overall condition
   */
  analyzeCondition(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let reasoning = '';

    const conditionField = (data['Condition'] || data['Product Condition'] || '').toLowerCase();

    if (conditionField.includes('excellent') || conditionField.includes('like new')) {
      scores.retain += 8;
      reasoning = 'Excellent condition warrants retention.';
    } else if (conditionField.includes('good')) {
      scores.retain += 5;
      scores.reuse += 3;
      reasoning = 'Good overall condition supports retention or reuse.';
    } else if (conditionField.includes('fair') || conditionField.includes('average')) {
      scores.reuse += 5;
      scores.repair += 4;
      reasoning = 'Fair condition suggests repair or reuse options.';
    } else if (conditionField.includes('poor')) {
      scores.repair += 5;
      scores.recycle += 3;
      reasoning = 'Poor condition may require significant repair.';
    } else if (conditionField.includes('broken')) {
      scores.recycle += 8;
      reasoning = 'Broken condition indicates recycling as primary option.';
    }

    return { scores, reasoning };
  }

  /**
   * Analyze warranty status
   */
  analyzeWarranty(data) {
    const scores = { recycle: 0, repair: 0, reuse: 0, retain: 0 };
    let reasoning = '';

    const warrantyField = (data['Warranty Status'] || data['Under Warranty'] || '').toLowerCase();

    if (warrantyField.includes('yes') || warrantyField.includes('active')) {
      scores.repair += 6;
      scores.retain += 4;
      reasoning = 'Active warranty enables free or low-cost repair.';
    } else if (warrantyField.includes('no') || warrantyField.includes('expired')) {
      scores.reuse += 2;
      reasoning = 'Expired warranty, self-funded repair or reuse considered.';
    }

    return { scores, reasoning };
  }

  /**
   * Analyze media files
   */
  analyzeMediaFiles(data) {
    const mediaFields = Object.entries(data).filter(([key, value]) => 
      typeof value === 'string' && 
      (value.includes('/uploads/') || value.match(/\.(jpg|jpeg|png|gif|mp4|mov)/i))
    );

    if (mediaFields.length > 0) {
      return {
        reasoning: `Visual documentation provided (${mediaFields.length} file${mediaFields.length > 1 ? 's' : ''}) for condition assessment.`
      };
    }

    return null;
  }

  /**
   * Merge scores
   */
  mergeScores(target, source) {
    for (const key in source) {
      target[key] += source[key];
    }
  }

  /**
   * Calculate final decision
   */
  calculateDecision(scores) {
    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);

    return {
      recommendation: entries[0][0],
      topScore: entries[0][1],
      secondScore: entries[1][1],
      margin: entries[0][1] - entries[1][1]
    };
  }

  /**
   * Calculate confidence
   */
  calculateConfidence(scores, decision) {
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const decisionScore = scores[decision];

    if (totalScore === 0) return 0.5;

    let confidence = decisionScore / totalScore;

    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    const margin = sortedScores[0] - sortedScores[1];
    
    if (margin >= 5) confidence = Math.min(confidence + 0.15, 1.0);
    if (margin >= 10) confidence = Math.min(confidence + 0.10, 1.0);
    if (margin >= 15) confidence = Math.min(confidence + 0.05, 1.0);

    return Math.round(confidence * 100) / 100;
  }
}

module.exports = AIAnalysisEngine;
