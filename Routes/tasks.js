const express = require('express');
const authenticateUser = require('../middleware/Auth');
const {TaskModel} = require('../Models/task.model');
const {UserModel} = require('../Models/user.model');
const {SubTaskModel} = require('../Models/subTask.model');
const cron = require('node-cron');
require("dotenv").config()
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const taskRoutes = express.Router();

// Add new task
taskRoutes.post('/', authenticateUser, async (req, res) => {
    try {
      const { title, description, due_date} = req.body;
      const userId = req.user_id;

        const today = new Date();
        const dueDate = new Date(due_date);
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
       if(daysDiff<=-1){
        return res.send({"success":true,"msg":"You cannot select past due date.Please select correct task due date"});
       }

        // Update the priority based on the calculated difference
        let task_priority=0;
        if (daysDiff === 0) {
          task_priority = 0;
        } else if (daysDiff <= 2) {
          task_priority = 1;
        } else if (daysDiff <= 4) {
          task_priority = 2;
        } else {
          task_priority = 3;
        }
  
      const task = new TaskModel({
        title,
        description,
        due_date,
        priority:task_priority,
        user: userId,
      });
      await task.save();
      res.send({"success":true,"msg":"Task Created successfully"});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Get all user tasks (with filters like priority, due date, and pagination)
  taskRoutes.get('/', authenticateUser, async (req, res) => {
    try {
      const userId = req.user_id;
      const { priority, due_date, page = 1, limit = 5 } = req.query;
  
      const query = { user: userId, deleted_at: { $exists: false } };
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
  
      const task = await TaskModel.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
     task.deleted_at = Date.now();
     await task.save();
    await SubTaskModel.updateMany({ task_id: taskId }, { deleted_at: Date.now() });

    res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  //---------------------------------------------------------------------//

  // cron job logic
  cron.schedule('0 0 * * *', async () => {
    try {
      const tasks = await TaskModel.find();
      
      tasks.forEach(async task => {
        const today = new Date();
        const dueDate = new Date(task.due_date);
        
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

  // Function to initiate a voice call using Twilio
async function initiateVoiceCall(userPhoneNumber) {
  try {
    const call = await client.calls.create({
      twiml: '<Response><Say>Ahoy, World!</Say></Response>',
      to: userPhoneNumber,
      from: '+919778554362'
    });
    console.log('Voice call initiated to:', userPhoneNumber, 'Call SID:', call.sid);
    return true;
  } catch (error) {
    console.error('Error initiating voice call:', error);
    return false;
  }
}

// Cron job to initiate voice calls for tasks that have passed their due dates
cron.schedule('0 0 * * *', async () => {
  try {
    const overdueTasks = await TaskModel.find({ due_date: { $lt: new Date() } });

    overdueTasks.sort((a, b) => a.priority - b.priority);

    const users = await UserModel.find().sort({ priority: 1 });

    let callMade = false;

    for (const user of users) {
      if (callMade) break; 
      for (const task of overdueTasks) {
        if (task.user.toString() === user._id.toString()) {
          if (!callMade) {
            const callStatus = await initiateVoiceCall(user.phone_number);
            if (callStatus) {
              callMade = true;
            }
          }
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error in voice calling cron job:', error);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});
  
  module.exports = {taskRoutes};
