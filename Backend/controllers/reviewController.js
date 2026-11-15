const Review = require("../models/Review");

// GET /api/reviews — visible to any logged-in user (students, faculty, admin)
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isVisible: true })
      .populate("user", "name role")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// POST /api/reviews — any student/faculty can submit one
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { userId } = req.user;

    if (!rating || rating < 1 || rating > 5 || !comment?.trim()) {
      return res.status(400).json({ message: "A rating and comment are required" });
    }

    const review = await Review.create({ user: userId, rating, comment });
    const populated = await review.populate("user", "name role");

    res.status(201).json({ message: "Review submitted", review: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

// DELETE /api/reviews/:id — admin only, for moderation
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete review" });
  }
};