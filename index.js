const express = require("express");
const multer = require("multer");
const app = express();
const fs = require("fs");

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/tasks", (req, res) => {
  readTodoFile((err, todos) => {
    if (err) {
      // console.log(err);
      res.status(500).send(err);
    } else {
      res.json(todos);
    }
  });
});

app.post("/task", upload.single("image"), (req, res) => {
  // console.log(req.body);
  // console.log(req.file);

  readTodoFile((err, todos) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      const newTaskId = todos.length > 0 ? todos[todos.length - 1].id + 1 : 1;

      const newTask = {
        taskImage: req.file,
        taskText: req.body.taskText,
        completed: false,
        id: newTaskId,
      };
      todos.push(newTask);
      writeTodoInFile(todos, (err) => {
        if (err) {
          console.log(err);
        }
      });

      res.json(newTask);
    }
  });
});

app.delete("/task/:id", (req, res) => {
  const taskId = parseInt(req.params.id); //re.params.id will give us the endpoint and save it to taskId

  //call the readTasksFile function which will give us all the tasks
  readTodoFile((err, tasks) => {
    if (err) {
      res.status(500).json({ error: "Failed to read tasks file." });
    } else {
      //tasks.filter will give us a new aray excluding the task that has the id=>taskId (this way we will not have the task that we want to delete)
      const updatedTasks = tasks.filter((t) => t.id !== taskId); //search for the task that we need to delete (search using the id we got using req.params.id)
      const taskToDelete = tasks.filter((t) => t.id === taskId);
      // console.log(taskToDelete);
      const imageToDelete = `${taskToDelete[0].taskImage.destination}${taskToDelete[0].taskImage.filename}`;
      fs.unlink(imageToDelete, (err) => {
        if (err) console.log("ERROR DELETING!", err);
      });
      //now the updatedTasks have all the task except the one that we wanted to delete,we can simply write the updatedTasks to the file
      writeTodoInFile(updatedTasks, (err) => {
        if (err) {
          res.status(500).json({ error: "Failed to write tasks file." });
        } else {
          res.json({ message: "Task deleted successfully.", taskId }); //give back the taskId and a message
        }
      });
    }
  });
});

app.put("/task/:id", (req, res) => {
  const taskId = parseInt(req.params.id); //save the id to variable taskID
  const completed = req.body.completeStatus; //save the sent data to completed varaible

  //read all the tasks from the file
  readTodoFile((err, tasks) => {
    if (err) {
      res.status(500).json({ error: "Failed to read tasks file." });
    } else {
      const task = tasks.find((t) => t.id === taskId); //find what task to modify and save it to task variable
      if (!task) {
        res.status(404).json({ error: "Task not found." }); //agr task nhi mila to
      } else {
        task.completed = completed; //modify the task variable (tasks array bhi modify hogua abb)
        writeTodoInFile(tasks, (err) => {
          //write the tasks array containing the modified task to the file
          if (err) {
            res.status(500).json({ error: "Failed to write tasks file." });
          } else {
            res.json({ message: "Task updated successfully.", task }); //return the modified task back
          }
        });
      }
    }
  });
});

function readTodoFile(callback) {
  fs.readFile("data.json", "utf-8", (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      todos = JSON.parse(data);
      callback(null, todos);
    }
  });
}

function writeTodoInFile(todos, callback) {
  fs.writeFile("data.json", JSON.stringify(todos), (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

app.listen(3000, () => {
  console.log("listening on port 3000");
});
