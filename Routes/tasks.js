const express = require('express');
const authenticateUser = require('../middleware/Auth');
const {TaskModel} = require('../Models/task.model');
const cron = require('node-cron');

const taskRoutes = express.Router();

// Add new task
taskRoutes.post('/', authenticateUser, async (req, res) => {
    try {
      const { title, description, due_date, priority } = req.body;
      const userId = req.user; // Assuming user ID is included in the JWT payload
  
      const task = new TaskModel({
        title,
        description,
        due_date,
        priority,
        user: userId,
      });
      await task.save();
      // res.status(201).json(task);
      res.send({"success":true,"msg":"Task Created successfully"});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Get all user tasks (with filters like priority, due date, and pagination)
  taskRoutes.get('/', authenticateUser, async (req, res) => {
    try {
      const userId = req.user;
      const { priority, due_date, page = 1, limit = 5 } = req.query;
  
      const query = { user: userId };
      if (priority) query.priority = priority;
      if (due_date) query.due_date = due_date;
  
      const tasks = await TaskModel.find(query)
        .sort({ due_date: 'asc' })
        .skip((page - 1) * limit)
        .limit(limit);
  
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Update task - due_date, status
  taskRoutes.put('/:id', authenticateUser, async (req, res) => {
    try {
      const { due_date, status } = req.body;
      const taskId = req.params.id;
  
      const task = await TaskModel.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      if (due_date) task.due_date = due_date;
      if (status) task.status = status;
  
      await task.save();
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Delete task (soft deletion)
  taskRoutes.delete('/:id', authenticateUser, async (req, res) => {
    try {
      const taskId = req.params.id;
  
      const task = await TaskModel.findByIdAndUpdate(taskId, { deleted_at: Date.now() });
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  //---------------------------------------------------------------------//

  // cron job logic
  cron.schedule('0 0 * * *', async () => {
    // Logic to update task priorities based on due dates
    try {
      // Find all tasks
      const tasks = await TaskModel.find();
      
      // Iterate through each task
      tasks.forEach(async task => {
        const today = new Date();
        const dueDate = new Date(task.due_date);
        
        // Calculate the difference in days between today and the due date
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Update the priority based on the calculated difference
        if (daysDiff === 0) {
          task.priority = 0;
        } else if (daysDiff <= 2) {
          task.priority = 1;
        } else if (daysDiff <= 4) {
          task.priority = 2;
        } else {
          task.priority = 3;
        }
        
        // Save the updated task
        await task.save();
      });
      
      console.log('Task priorities updated successfully.');
    } catch (error) {
      console.error('Error updating task priorities:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  
  module.exports = {taskRoutes};
