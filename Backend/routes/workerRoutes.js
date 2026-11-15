const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/roleMiddleware");
const {
  getWorkers,
  createWorker,
  toggleWorkerStatus,
  deleteWorker,
  assignWorker,
  assignSupervisor,
  getWorkersBySupervisor,
  getMyWorkers,
  unassignSupervisor,
} = require("../controllers/workerController");

// Admins manage the list; supervisors just need to see it to assign tasks.
router.get("/", protect, checkRole(["admin", "supervisor"]), getWorkers);
router.post("/", protect, checkRole(["admin"]), createWorker);
router.patch("/:id/status", protect, checkRole(["admin"]), toggleWorkerStatus);
router.delete("/:id", protect, checkRole(["admin"]), deleteWorker);
router.patch("/:id/assign-worker", protect, checkRole(["supervisor", "admin"]), assignWorker);
router.patch("/assign-supervisor", protect, checkRole(["admin"]), assignSupervisor);
router.patch("/:id/unassign-supervisor", protect, checkRole(["admin"]), unassignSupervisor);
router.get("/mine", protect, checkRole(["supervisor"]), getMyWorkers);
router.get("/by-supervisor/:supervisorId", protect, checkRole(["admin", "supervisor"]), getWorkersBySupervisor);


module.exports = router;