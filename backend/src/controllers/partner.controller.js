import PartnerApplication from '../models/PartnerApplication.js';

// @desc    Register as a partner
// @route   POST /api/partners/register
export const registerPartner = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, bio, skills, experience } = req.body;

    const application = await PartnerApplication.create({
      fullName,
      email,
      phoneNumber,
      bio,
      skills,
      experience,
    });

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all partner applications (Admin only)
// @route   GET /api/partners/applications
export const getPartnerApplications = async (req, res, next) => {
  try {
    const applications = await PartnerApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Review a partner application (Admin only)
// @route   PATCH /api/partners/:id/review
export const reviewPartnerApplication = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const application = await PartnerApplication.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Không tìm thấy đơn đăng ký');
    }

    application.status = status || application.status;
    application.reviewNotes = reviewNotes || application.reviewNotes;
    application.reviewedAt = new Date();

    const updatedApplication = await application.save();
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
};
