const express = require('express');
const authenticateUser = require('../middleware/Auth');
const {SubTaskModel} = require('../Models/subTask.model');

const subTaskRoutes = express.Router();

// Add new SUbTask
subTaskRoutes.post('/', authenticateUser, async (req, res) => {
    try {
      const { task_id } = req.body;
      const subTask = new SubTaskModel({task_id});
      await subTask.save();
      res.send({"success":true,"msg":`SubTask Created successfully for Task ID ${task_id}`});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Get all user subTasks (with filter of task_id)
  subTaskRoutes.get('/', authenticateUser, async (req, res) => {
    try {
      const { task_id } = req.query;
      const tasks = await SubTaskModel.find({task_id, deleted_at: { $exists: false } });
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Update subTask - status
  subTaskRoutes.put('/:id', authenticateUser, async (req, res) => {
    try {
      const {status } = req.body;
      const subTaskId = req.params.id;
      const subTask = await SubTaskModel.findByIdAndUpdate(subTaskId,{ status: status });
      console.log(subTask)
     // await subTask.save();
      res.json({ message: 'SubTask updated successfully'});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Delete subtask (soft deletion)
  subTaskRoutes.delete('/:id', authenticateUser, async (req, res) => {
    try {
      const subTaskId = req.params.id;
  
      const subTask = await SubTaskModel.findByIdAndUpdate(subTaskId, { deleted_at: Date.now() });
      if (!subTask) {
        return res.status(404).json({ message: 'SubTask not found' });
      }
  
      res.json({ message: 'SubTask deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
module.exports = {subTaskRoutes};
