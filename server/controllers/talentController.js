const Task = require('../models/Task');

// @desc  Get all available (Open) tasks
// @route GET /api/talent/tasks/available
// @access Talent
const getAvailableTasks = async (req, res) => {
  try {
    // (loose schema allows this inconsistent state from seed data)
    const tasks = await Task.find({ status: 'Open' })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get tasks assigned to the logged-in talent
// @route GET /api/talent/tasks/mine
// @access Talent
const getMyTasks = async (req, res) => {
  try {
    // all come back mixed together with no grouping
    const tasks = await Task.find({ assignedTo: req.user._id })
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Claim an open task
// @route PUT /api/talent/tasks/:id/claim
// @access Talent
const claimTask = async (req, res) => {
  try {
    // Two talents can both pass the status === 'Open' check before either saves,
    // then both write Claimed. Proper fix: findOneAndUpdate({ _id, status: 'Open' })
    const taskId = req.params.id;

    const task = await Task.findOneAndUpdate(
    {
        _id: taskId,
        status: "Open"
    },
    {
        $set: {
            status: "CLAIMED",
            assignedTo: req.user._id
        }
    },
    { new: true }
);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAvailableTasks, getMyTasks, claimTask };