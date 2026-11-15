const Worker = require("../models/Worker");

exports.getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
};

exports.createWorker = async (req, res) => {
  try {
    const { name, mobile, trade, department } = req.body;

    if (!name || !mobile || !trade) {
      return res.status(400).json({ message: "Name, mobile, and trade are required" });
    }

    const worker = await Worker.create({
      name,
      mobile,
      trade,
      department,
      addedBy: req.user.userId,
    });

    res.status(201).json({ message: "Worker added", worker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add worker" });
  }
};

exports.toggleWorkerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const worker = await Worker.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json({ message: `Worker ${isActive ? "activated" : "deactivated"}`, worker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update worker status" });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json({ message: "Worker deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete worker" });
  }
};
const User = require("../models/User");
exports.assignWorker = async (req, res) => {
  try {
    // Adjust this to match whatever your assignment logic actually needs —
    // e.g. linking a worker to a task/job by id from req.body.
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    worker.assignedTask = taskId;
    await worker.save();

    res.json({ message: "Worker assigned", worker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to assign worker" });
  }
};

exports.assignSupervisor = async (req, res) => {
  try {
    const { workerIds, supervisorId } = req.body;

    if (!Array.isArray(workerIds) || workerIds.length === 0 || !supervisorId) {
      return res.status(400).json({ message: "workerIds (array) and supervisorId are required" });
    }

    const supervisor = await User.findOne({ _id: supervisorId, role: "supervisor", isActive: true });
    if (!supervisor) {
      return res.status(404).json({ message: "Active supervisor not found" });
    }

    await Worker.updateMany(
      { _id: { $in: workerIds } },
      { $set: { supervisor: supervisorId } }
    );

    const updatedWorkers = await Worker.find({ _id: { $in: workerIds } });
    res.json({ message: "Workers assigned to supervisor", workers: updatedWorkers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to assign workers" });
  }
};

exports.getWorkersBySupervisor = async (req, res) => {
  try {
    const workers = await Worker.find({ supervisor: req.params.supervisorId }).sort({ name: 1 });
    res.json(workers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch workers for supervisor" });
  }
};
exports.unassignSupervisor = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, { supervisor: null }, { new: true });
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json({ message: "Worker unassigned", worker });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to unassign worker" });
  }
};
// controllers/workerController.js
exports.getMyWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ supervisor: req.user.userId }).sort({ name: 1 });
    res.json(workers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your workers" });
  }
};