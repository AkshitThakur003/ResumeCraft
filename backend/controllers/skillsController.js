const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get user skills
 * @route   GET /api/user/skills
 * @access  Private
 */
const getSkills = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      skills: user.skills || [],
    },
  });
});

/**
 * @desc    Add a skill
 * @route   POST /api/user/skills
 * @access  Private
 */
const addSkill = asyncHandler(async (req, res) => {
  const { name, level } = req.body;

  if (!name || !level) {
    return res.status(400).json({
      success: false,
      message: 'Skill name and level are required',
    });
  }

  const user = await User.findById(req.user._id);

  // Check if skill already exists
  const existingSkill = user.skills.find(skill => skill.name.toLowerCase() === name.toLowerCase());
  if (existingSkill) {
    return res.status(400).json({
      success: false,
      message: 'Skill already exists',
    });
  }

  user.skills.push({ name, level });
  await user.save();
  res.json({
    success: true,
    data: {
      skills: user.skills,
    },
  });
});

/**
 * @desc    Update a skill
 * @route   PUT /api/user/skills/:id
 * @access  Private
 */
const updateSkill = asyncHandler(async (req, res) => {
  const { name, level } = req.body;
  const skillId = req.params.id;

  const user = await User.findById(req.user._id);
  const skill = user.skills.id(skillId);

  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found',
    });
  }

  if (name !== undefined) skill.name = name;
  if (level !== undefined) skill.level = level;

  await user.save();

  res.json({
    success: true,
    data: {
      skills: user.skills,
    },
  });
});

/**
 * @desc    Delete a skill
 * @route   DELETE /api/user/skills/:id
 * @access  Private
 */
const deleteSkill = asyncHandler(async (req, res) => {
  const skillId = req.params.id;

  const user = await User.findById(req.user._id);
  const skill = user.skills.id(skillId);

  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found',
    });
  }

  user.skills.pull(skillId);
  await user.save();
  res.json({
    success: true,
    data: {
      skills: user.skills,
    },
  });
});

module.exports = {
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
};

