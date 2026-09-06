import { Router } from 'express';

export const feedbackRouter = Router();

const storedFeedbacks: any[] = [];

// GET /api/feedback - Get customer feedback items
feedbackRouter.get('/', (req, res) => {
  res.json({
    success: true,
    data: storedFeedbacks,
  });
});

// POST /api/feedback - Save customer feedback
feedbackRouter.post('/', (req, res) => {
  const feedbackData = {
    ...req.body,
    timestamp: new Date().toISOString(),
  };
  storedFeedbacks.unshift(feedbackData);
  res.json({
    success: true,
    message: 'Feedback received successfully',
  });
});
