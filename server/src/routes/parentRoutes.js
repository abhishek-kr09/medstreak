const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { listLinkedStudents } = require("../controllers/parentController");

const router = express.Router();

router.get("/me/students", requireAuth, allowRoles("parent"), listLinkedStudents);

module.exports = router;
