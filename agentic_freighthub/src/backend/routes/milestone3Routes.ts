import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import {
  assessWeatherForRoute,
  getAllWeatherAlerts,
  acknowledgeWeatherAlert
} from '../weather/weatherService';
import {
  validateCustomsCompliance,
  searchRegulationsRAG,
  signOffCustomsCheck,
  getAllComplianceChecks,
  getComplianceCheckById,
  uploadShipmentDocument,
  manualEditComplianceCheck,
  verifySingleChecklistItem,
  getCustomsAuditLogs,
  addCustomsAuditLog
} from '../customs/customsService';
import {
  assessShipmentCompositeRisk,
  getShipmentRisk,
  getAllRiskAlerts,
  acknowledgeRiskAlert
} from '../risk/riskEngine';
import {
  predictMLPrice,
  compareRuleVsMLPricing,
  getMLModelEvaluationMetrics
} from '../pricing/mlPricingService';
import { mlDatasetEngine } from '../pricing/mlDatasetEngine';
import {
  SEEDED_DATA_FRESHNESS,
  SEEDED_SYNC_LOGS,
  SEEDED_REGULATION_DOCS,
  SEEDED_REGULATION_CHUNKS,
  SEEDED_HS_CODES
} from '../../data/milestone3Data';

export const milestone3Router = Router();

// ==========================================
// 1. Weather Intelligence API Endpoints
// ==========================================

/**
 * POST /v1/weather/assess
 * Assess weather risk for route and departure window
 */
milestone3Router.post('/v1/weather/assess', (req: Request, res: Response) => {
  try {
    const { shipmentId, quoteId, routeId, originPort, destPort, departureDate, transportMode } = req.body;
    if (!originPort || !destPort) {
      return res.status(400).json({ error: 'originPort and destPort are required.' });
    }
    const assessment = assessWeatherForRoute({
      shipmentId,
      quoteId,
      routeId,
      originPort,
      destPort,
      departureDate,
      transportMode,
    });
    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Customs Intelligence & RAG Endpoints
// ==========================================

/**
 * POST /v1/customs/validate
 * Validate customs requirements and documentation
 */
milestone3Router.post('/v1/customs/validate', (req: Request, res: Response) => {
  try {
    const {
      shipmentId,
      quoteId,
      originCountry,
      destCountry,
      originPort,
      destPort,
      hsCode,
      commodity,
      incoterm,
      declaredValueInr,
      isHazmat,
      uploadedDocuments,
    } = req.body;

    const complianceCheck = validateCustomsCompliance({
      shipmentId,
      quoteId,
      originCountry: originCountry || 'IN',
      destCountry: destCountry || 'SG',
      originPort: originPort || 'MAA',
      destPort: destPort || 'SGSIN',
      hsCode: hsCode || '8471.30.10',
      commodity: commodity || 'Commercial Cargo',
      incoterm: incoterm || 'FOB',
      declaredValueInr: declaredValueInr || 2000000,
      isHazmat,
      uploadedDocuments,
    });

    return res.json({ success: true, data: complianceCheck });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/customs/checks
 * List all compliance cases (Pending & Historical)
 */
milestone3Router.get('/v1/customs/checks', (req: Request, res: Response) => {
  try {
    const checks = getAllComplianceChecks();
    return res.json({ success: true, data: checks, count: checks.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/customs/checks/:id
 * Get single compliance check by ID
 */
milestone3Router.get('/v1/customs/checks/:id', (req: Request, res: Response) => {
  try {
    const check = getComplianceCheckById(req.params.id);
    if (!check) {
      return res.status(404).json({ error: 'Compliance check not found' });
    }
    return res.json({ success: true, data: check });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/customs/:check_id/sign-off
 * Approve / Reject / Conditionally Approve customs check
 */
milestone3Router.post('/v1/customs/:check_id/sign-off', (req: Request, res: Response) => {
  try {
    const { check_id } = req.params;
    const { action, reviewerEmail, reviewerNotes } = req.body;

    if (!action || !['APPROVE', 'REQUEST_DOCUMENTS', 'CONDITIONAL', 'REJECT'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action. Must be APPROVE, REQUEST_DOCUMENTS, CONDITIONAL, or REJECT.',
      });
    }

    const updatedCheck = signOffCustomsCheck(
      check_id,
      action,
      reviewerEmail || 'customs@freighthub.in',
      reviewerNotes || 'Customs compliance review completed.'
    );

    if (!updatedCheck) {
      return res.status(404).json({ error: 'Compliance check not found' });
    }

    return res.json({
      success: true,
      message: `Customs check ${check_id} transitioned to ${action}`,
      data: updatedCheck,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /v1/customs/:check_id/manual-edit
 * Customer Officer Manual Case Editing (HS code, cargo details, checklist, status, risk level)
 */
milestone3Router.put('/v1/customs/:check_id/manual-edit', (req: Request, res: Response) => {
  try {
    const { check_id } = req.params;
    const {
      hsCodeDeclared,
      hsCodeMatched,
      commodityDescription,
      status,
      riskLevel,
      officerNotes,
      dutyOverrideBcdPct,
      dutyOverrideIgstPct,
      checklistItems,
      officerEmail,
    } = req.body;

    const updatedCheck = manualEditComplianceCheck(
      check_id,
      {
        hsCodeDeclared,
        hsCodeMatched,
        commodityDescription,
        status,
        riskLevel,
        officerNotes,
        dutyOverrideBcdPct,
        dutyOverrideIgstPct,
        checklistItems,
      },
      officerEmail || 'customer.officer@freighthub.in'
    );

    if (!updatedCheck) {
      return res.status(404).json({ error: 'Compliance check not found' });
    }

    return res.json({
      success: true,
      message: `Compliance case ${check_id} updated successfully by compliance officer`,
      data: updatedCheck,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /v1/customs/:check_id/verify-item/:item_id
 * Customer Officer Item-by-item verification and notes
 */
milestone3Router.put('/v1/customs/:check_id/verify-item/:item_id', (req: Request, res: Response) => {
  try {
    const { check_id, item_id } = req.params;
    const { status, evidence, citation, officerNotes, officerEmail } = req.body;

    if (!status || !['VERIFIED', 'PENDING', 'DISCREPANCY', 'WAIVED'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be VERIFIED, PENDING, DISCREPANCY, or WAIVED.',
      });
    }

    const updatedCheck = verifySingleChecklistItem(
      check_id,
      item_id,
      { status, evidence, citation, officerNotes },
      officerEmail || 'customer.officer@freighthub.in'
    );

    if (!updatedCheck) {
      return res.status(404).json({ error: 'Compliance check or item not found' });
    }

    return res.json({
      success: true,
      message: `Checklist item ${item_id} verified as ${status}`,
      data: updatedCheck,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/customs/audit-logs
 * Compliance & Officer Determination Audit Trail
 */
milestone3Router.get('/v1/customs/audit-logs', (_req: Request, res: Response) => {
  try {
    const logs = getCustomsAuditLogs();
    return res.json({ success: true, data: logs, count: logs.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET & POST /v1/regulations/search
 * Search regulation corpus with citations
 */
const handleRegulationsSearch = (req: Request, res: Response) => {
  try {
    const query = req.body?.query || req.query?.q || req.query?.query || '';
    const country = req.body?.country || req.query?.country;
    const limit = Number(req.body?.limit || req.query?.limit || 8);

    if (!query) {
      return res.json({ success: true, data: SEEDED_REGULATION_CHUNKS, results: SEEDED_REGULATION_CHUNKS, count: SEEDED_REGULATION_CHUNKS.length });
    }
    const results = searchRegulationsRAG(String(query), country ? String(country) : undefined, limit);
    return res.json({ success: true, data: results, results: results, count: results.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

milestone3Router.get('/v1/regulations/search', handleRegulationsSearch);
milestone3Router.post('/v1/regulations/search', handleRegulationsSearch);

/**
 * GET /v1/regulations/documents
 */
milestone3Router.get('/v1/regulations/documents', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_REGULATION_DOCS });
});

/**
 * GET /v1/customs/hs-codes
 */
milestone3Router.get('/v1/customs/hs-codes', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_HS_CODES });
});

/**
 * POST /v1/shipments/upload-document
 */
milestone3Router.post('/v1/shipments/upload-document', (req: Request, res: Response) => {
  try {
    const doc = uploadShipmentDocument(req.body);
    return res.json({ success: true, data: doc });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. Shipment Composite Risk Engine Endpoints
// ==========================================

/**
 * GET /v1/risk/:shipment_id
 * Get current composite shipment risk
 */
milestone3Router.get('/v1/risk/:shipment_id', (req: Request, res: Response) => {
  try {
    const assessment = getShipmentRisk(req.params.shipment_id);
    if (!assessment) {
      // Auto generate on the fly
      const dynamic = assessShipmentCompositeRisk({
        shipmentId: req.params.shipment_id,
      });
      return res.json({ success: true, data: dynamic });
    }
    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/risk/assess
 * Create/recalculate composite risk assessment
 */
milestone3Router.post('/v1/risk/assess', (req: Request, res: Response) => {
  try {
    const assessment = assessShipmentCompositeRisk(req.body);
    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Alerts API Endpoints
// ==========================================

/**
 * GET /v1/alerts
 * List all weather & risk alerts
 */
milestone3Router.get('/v1/alerts', (req: Request, res: Response) => {
  try {
    const weatherAlerts = getAllWeatherAlerts();
    const riskAlerts = getAllRiskAlerts();
    return res.json({
      success: true,
      weatherAlerts,
      riskAlerts,
      totalCount: weatherAlerts.length + riskAlerts.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/alerts/:id/acknowledge
 * Acknowledge alert
 */
milestone3Router.post('/v1/alerts/:id/acknowledge', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req.body;
    const weatherAck = acknowledgeWeatherAlert(id);
    const riskAck = acknowledgeRiskAlert(id, user);

    if (!weatherAck && !riskAck) {
      return res.status(404).json({ error: 'Alert not found or already acknowledged' });
    }

    return res.json({ success: true, message: `Alert ${id} acknowledged successfully` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. ML Pricing API Endpoints
// ==========================================

/**
 * POST /v1/pricing/ml & POST /v1/ml-pricing/predict
 * ML price prediction and comparison
 */
milestone3Router.post(['/v1/pricing/ml', '/v1/ml-pricing/predict'], (req: Request, res: Response) => {
  try {
    const { quoteId, ruleBasePriceInr, ruleBreakdown, ...features } = req.body;
    
    if (ruleBasePriceInr && ruleBreakdown) {
      const comparison = compareRuleVsMLPricing(
        quoteId || 'Q-SAMPLE',
        ruleBasePriceInr,
        ruleBreakdown,
        features
      );
      return res.json({ success: true, data: comparison });
    }

    const prediction = predictMLPrice(features);
    return res.json({ success: true, data: prediction });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/pricing/train
 * Trigger high-accuracy training of the ML model directly on the 5,000-row CSV dataset
 */
milestone3Router.post('/v1/pricing/train', (req: Request, res: Response) => {
  try {
    const result = mlDatasetEngine.trainModel();
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/pricing/dataset/stats
 * Get exploratory data analysis summary of the 5,000-row CSV training dataset
 */
milestone3Router.get('/v1/pricing/dataset/stats', (req: Request, res: Response) => {
  try {
    const stats = mlDatasetEngine.getDatasetSummary();
    const latestTraining = mlDatasetEngine.getLatestTrainingResult();
    return res.json({
      success: true,
      stats,
      latestTraining,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/pricing/python-script
 * Return the complete Python training script with NumPy, Pandas, Scikit-Learn, LightGBM
 */
milestone3Router.get('/v1/pricing/python-script', (req: Request, res: Response) => {
  try {
    const scriptPath = path.join(process.cwd(), 'src/backend/pricing/train_pricing_model.py');
    const scriptContent = fs.existsSync(scriptPath)
      ? fs.readFileSync(scriptPath, 'utf-8')
      : '# train_pricing_model.py not found';
    return res.json({
      success: true,
      fileName: 'train_pricing_model.py',
      scriptContent,
      datasetPath: 'src/backend/pricing/data/freight_pricing_training_dataset_5000.csv',
      pythonVersion: '3.10+',
      dependencies: ['numpy>=1.24.0', 'pandas>=2.0.0', 'scikit-learn>=1.3.0', 'lightgbm>=4.0.0', 'joblib>=1.3.0'],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /v1/ml-pricing/models
 * Get ML model performance metrics MAE/RMSE/R2
 */
milestone3Router.get('/v1/ml-pricing/models', (req: Request, res: Response) => {
  try {
    const metrics = getMLModelEvaluationMetrics();
    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. Data Freshness & Sync Logs
// ==========================================

milestone3Router.get('/v1/system/data-freshness', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_DATA_FRESHNESS });
});

milestone3Router.get('/v1/system/sync-logs', (req: Request, res: Response) => {
  return res.json({ success: true, data: SEEDED_SYNC_LOGS });
});
