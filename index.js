import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import path from "path";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import multer from "multer";
import { log } from "console";
import { name } from "ejs";
const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/img");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});
const assignment = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/img");
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, req.user.rollno + "-" + req.user.name + extension);
  },
});
const upload = multer({ storage });
const pdf = multer({ storage: assignment });
const port = 3000;
env.config();
app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "ERP",
  password: "root",
  port: 5432,
});
db.connect().then(() => {
  console.log("Database Connected Successfully");
});
app.get("/", (req, res) => {
  res.render("login.ejs");
});
//Students get Routes
app.get("/studentDashboard", (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.user);
    res.render("index.ejs", { name: req.user.name });
  } else {
    res.redirect("/");
  }
});
app.get("/studentDashboard/Attendance", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("tables.ejs", { name: req.user.name });
  } else {
    res.redirect("/");
  }
});
app.get("/studentDashboard/register", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("semesterRegistration.ejs", { name: req.user.name });
  } else {
    res.redirect("/");
  }
});
app.get("/studentDashboard/event", async (req, res) => {
  if (req.isAuthenticated()) {
    var result = await db.query("select * from event");
    console.log(req.user);


    res.render("Event.ejs", { event: result.rows, name: req.user.name });
  } else {
    res.redirect("/");
  }
});
app.get("/studentDashboard/Assignment", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    const { section, rollno, name } = req.user;

    // Fetch assignments for the user's section
    const assignmentQuery = await db.query(
      "SELECT * FROM assignment WHERE section = $1",
      [section]
    );
    const assignments = assignmentQuery.rows;

    // Fetch responses submitted by the student
    const responseQuery = await db.query(
      "SELECT * FROM responce WHERE rollno = $1",
      [rollno]
    );
    const responses = responseQuery.rows;

    // Fetch reviews given to the student
    const reviewQuery = await db.query(
      "SELECT assignment_name, grade, review FROM review WHERE rollno = $1",
      [rollno]
    );
    const reviews = reviewQuery.rows;

    res.render("Assignment.ejs", {
      name,
      assignments,
      user: req.user,
      response: responses,
      review: reviews,
    });
  } catch (err) {
    console.error("Error fetching assignment details:", err);
    res.redirect("/");
  }
});

app.get("/studentDashboard/leave", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query("select * from leave where rollno = $1", [
      req.user.rollno,
    ]);
    console.log(result.rows);
    res.render("Leave.ejs", { name: req.user.name, leave: result.rows });
  } else {
    res.redirect("/");
  }
});
app.get("/studentDashboard/leave/apply", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query(
      "select name from faculty where section= $1",
      [req.user.section]
    );
    res.render("apply_leave.ejs", {
      userName: req.user.name,
      rollno: req.user.rollno,
      faculty: result.rows,
      section: req.user.section,
    });
  } else {
    res.redirect("/");
  }
});
app.get("/submit/:assignId", async (req, res) => {
  try {
    const result = await db.query(
      "select * from assignment where assignment_id = $1",
      [req.params.assignId.substring(1)]
    );
    res.render("submitAssignment.ejs", { assign: result.rows });
  } catch (err) {}
});
//Teacher / admin get Routes
app.get("/facultyDashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("adminDashboard.ejs", { name: req.user.name });
  } else {
    res.redirect("/");
  }
});
app.get("/facultyDashboard/attendance", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query("SELECT * FROM faculty_sub WHERE id = $1", [
        req.user.id,
      ]);
      res.render("adminAttendance.ejs", {
        name: req.user.name,
        attendance: result.rows,
      });
    } catch (e) {}
  } else {
    res.redirect("/");
  }
});

app.get("/facultyDashboard/attendance/:section/:semester", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query(
        "select rollno,name from student where section=$1 and semester = $2",
        [req.params.section, req.params.semester]
      );
      var subject = await db.query(
        "select subject from faculty_sub where section=$1 and semester=$2",
        [req.params.section, req.params.semester]
      );
      res.render("giveAttendance.ejs", {
        name: req.user.name,
        students: result.rows,
        user: req.user,
        subject: subject.rows[0].subject,
        section: req.params.section,
        semester: req.params.semester,
      });
    } catch (err) {}
  } else {
    res.redirect("/");
  }
});

app.get("/facultyDashboard/register", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("verifyRegister.ejs", { name: req.user.name });
  } else {
    res.redirect("/");
  }
});
app.get("/facultyDashboard/leave", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query("select * from leave where section=$1", [
      req.user.section,
    ]);
    res.render("verifyLeave.ejs", { name: req.user.name, leave: result.rows });
  } else {
    res.redirect("/");
  }
});
app.get("/approve/:id", async (req, res) => {
  try {
    await db.query("update leave set status = $1 where leave_id = $2", [
      "Approved",
      req.params.id,
    ]);
    res.redirect("/facultyDashboard/leave");
  } catch (err) {
    console.log(err);
  }
});
app.get("/reject/:id", async (req, res) => {
  try {
    await db.query("update leave set status = $1 where leave_id = $2", [
      "Rejected",
      req.params.id,
    ]);
    res.redirect("/facultyDashboard/leave");
  } catch (err) {
    console.log(err);
  }
});
app.get("/facultyDashboard/Assignment", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query(
        "select section,subject from faculty_sub where id=$1",
        [req.user.id]
      );
      const assignment = await db.query(
        "select * from assignment where id = $1",
        [req.user.id]
      );
      res.render("verifyAssignment.ejs", {
        name: req.user.name,
        sec: result.rows,
        assign: assignment.rows,
      });
    } catch (err) {}
  } else {
    res.redirect("/");
  }
});
app.get("/facultyDashboard/event", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query("select * from event");
    res.render("addEvent.ejs", { event: result.rows, name: req.user.name });
  } else {
    res.redirect("/");
  }
});
app.get("/Dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.type == "student") {
      res.redirect("/studentDashboard");
    } else {
      res.redirect("/facultyDashboard");
    }
  }
});
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
app.get("/facultyDashboard/createEvent", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("createEvent.ejs");
  }
});
app.get("/facultyDashboard/Assignment/:id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query(
        "select * from responce where assignment_id = $1",
        [req.params.id.substring(1)]
      );
      res.render("resonces.ejs", { res: result.rows });
    } catch (err) {}
  } else {
    res.redirect("/");
  }
});
app.get("/changepassword", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("changePassword.ejs");
  } else {
    res.redirect("/");
  }
});
//Post request routes
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/Dashboard",
    failureRedirect: "/",
  })
);
app.post(
  "/facultyDashboard/createEvent",
  upload.single("eventImage"),
  async (req, res) => {
    try {
      const { EventName, EventDetail, start, end, venue } = req.body;
      const src = req.file.filename;

      const result = await db.query(
        "INSERT INTO event (name, details, start_date, end_date, venue, img_src) VALUES ($1, $2, $3, $4, $5, $6)",
        [EventName, EventDetail, start, end, venue, src]
      );
      res.redirect("/facultyDashboard/event");
    } catch (err) {
      console.error("Error creating event:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);
app.post("/studentDashboard/leave/apply", async (req, res) => {
  const { name, rollno, section } = req.user;
  const { reason, from, to } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO leave (student_name, rollno, section, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5, $6)",
      [name, rollno, section, from, to, reason]
    );
    res.redirect("/studentDashboard/leave");
  } catch (err) {
    console.error("Error inserting leave:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/facultyDashboard/Assignment/create", async (req, res) => {
  try {
    var id = req.user.id;
    var name = req.user.name;
    var { section, subject, Assignment, Last_date } = req.body;
    await db.query(
      "insert into assignment(id,name,section,subject,assignment_name,last_date) values($1,$2,$3,$4,$5,$6)",
      [id, name, section, subject, Assignment, Last_date]
    );
    res.redirect("/facultyDashboard/Assignment");
  } catch (err) {}
});
app.post(
  "/studentDashboard/Assignment/submit/:assign/:id",
  pdf.single("eventImage"),
  async (req, res) => {
    try {
      await db.query(
        "insert into responce(rollno,name,assignment_id,faculty_id,file_name,status) values ($1,$2,$3,$4,$5,$6)",
        [
          req.user.rollno,
          req.user.name,
          req.params.assign.substring(1),
          req.params.id.substring(1),
          req.file.filename,
          "Submitted",
        ]
      );
      res.redirect("/studentDashboard/Assignment");
    } catch (err) {
      console.log(err.message);
    }
  }
);
app.post("/verify/:rollno/:assignment_id", async (req, res) => {
  try {
    const assign_name = await db.query(
      "select assignment_name from assignment where assignment_id = $1",
      [req.params.assignment_id.substring(1)]
    );
    var name = assign_name.rows[0].assignment_name;
    await db.query(
      "insert into review(assignment_name,rollno,grade,review) values ($1,$2,$3,$4)",
      [name, req.params.rollno.substring(1), req.body.grade, req.body.review]
    );
    await db.query(
      "update responce set status = $1 where rollno = $2 and assignment_id = $3",
      [
        "Verified",
        req.params.rollno.substring(1),
        req.params.assignment_id.substring(1),
      ]
    );
    res.redirect(`/facultyDashboard/Assignment/${req.params.assignment_id}`);
  } catch (err) {}
});

app.post("/submitAttendance", (req, res) => {
  console.log(req.body);
  res.redirect("/facultyDashboard/attendance");
});
//post route ends
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      if (username.length == 8 || username.length == 9) {
        const result = await db.query("select * from student where rollno=$1", [
          username,
        ]);
        // console.log(result.rows)
        if (result.rowCount == 0) {
          return cb(null, false, "No user found");
        } else {
          const user = result.rows[0];
          const user_password = user.password;
          if (password == user_password) {
            return cb(null, user);
          } else {
            return cb(null, false);
          }
        }
      } else if (username.length == 4) {
        const result = await db.query("select * from faculty where id= $1", [
          username,
        ]);
        if (result.rowCount > 0) {
          const user = result.rows[0];
          const user_password = user.password;
          if (password == user_password) {
            return cb(null, user);
          } else {
            return cb(null, false);
          }
        } else {
          return cb(null, false, "No user find");
        }
      } else {
        return cb(null, false, "Invalid");
      }
    } catch (err) {
      console.log(err);
    }
  })
);
passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});
app.listen(port, () => {
  console.log(`Server is running on the port ${port}`);
});
