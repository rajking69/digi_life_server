const reportsService = require("../services/reports.service");
const { ObjectId } = require("mongodb");

const createReport = async (req, res) => {
    try {
        const { lessonId, reason } = req.body;
        const reporterUserId = req.user._id.toString();
        const reporterEmail = req.user.email;

        if (!lessonId || !reason) {
            return res.status(400).json({
                success: false,
                message: "lessonId and reason are required fields."
            });
        }

        if (!ObjectId.isValid(lessonId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        const newReport = await reportsService.createReport({ 
            lessonId, 
            reporterUserId, 
            reporterEmail, 
            reason 
        });
        
        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: newReport
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getReports = async (req, res) => {
    try {
        const result = await reportsService.getReports(req.query);
        res.status(200).json({
            success: true,
            message: "Reports fetched successfully",
            ...result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid report ID format" });
        }

        await reportsService.deleteReport(id);

        res.status(200).json({
            success: true,
            message: "Report deleted successfully",
            data: null
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

module.exports = {
    createReport,
    getReports,
    deleteReport
};
