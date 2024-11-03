const mongoose = require("mongoose");
const moment = require("moment");
const formatNumber = {
  round: (number) => {
    if (typeof number !== "number" || isNaN(number)) return 0;
    return Math.round(number * 100) / 100;
  },
};
const dailyActivitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  lessonsCompleted: {
    type: Number,
    default: 0,
  },
  coursesCompleted: {
    type: Number,
    default: 0,
  },
  studyHours: {
    type: Number,
    default: 0,
    get: (v) => formatNumber.round(v),
    set: (v) => formatNumber.round(v),
  },
});

const achievementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "7DayStreak",
      "30DayStreak",
      "50LessonsCompleted",
      "5CoursesCompleted",
      "100StudyHours",
    ],
    required: true,
  },
  achievedDate: {
    type: Date,
    required: true,
  },
});

const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
    totalLessonsCompleted: {
      type: Number,
      default: 0,
    },
    totalCoursesCompleted: {
      type: Number,
      default: 0,
    },
    totalStudyHours: {
      type: Number,
      default: 0,
      get: (v) => formatNumber.round(v),
      set: (v) => formatNumber.round(v),
    },
    dailyActivities: [dailyActivitySchema],
    achievements: [achievementSchema],
  },
  {
    timestamps: true,
  }
);

streakSchema.index({ userId: 1, "dailyActivities.date": 1 });

streakSchema.methods.updateStreak = async function (
  activityDate,
  lessonsCompleted,
  coursesCompleted,
  studyHours
) {
  const today = new Date(activityDate);
  today.setHours(0, 0, 0, 0);

  studyHours = formatNumber.round(studyHours);

  let dailyActivity = this.dailyActivities.find(
    (activity) => activity.date.getTime() === today.getTime()
  );

  if (!dailyActivity) {
    dailyActivity = {
      date: today,
      lessonsCompleted: 0,
      coursesCompleted: 0,
      studyHours: 0,
    };
    this.dailyActivities.push(dailyActivity);

    // ... streak calculation code remains the same ...
  }

  // Update daily activity
  dailyActivity.lessonsCompleted += parseInt(lessonsCompleted) || 0;
  dailyActivity.coursesCompleted += parseInt(coursesCompleted) || 0;
  dailyActivity.studyHours = formatNumber.round(
    dailyActivity.studyHours + studyHours
  );

  // Update totals
  this.totalLessonsCompleted += parseInt(lessonsCompleted) || 0;
  this.totalCoursesCompleted += parseInt(coursesCompleted) || 0;
  this.totalStudyHours = formatNumber.round(this.totalStudyHours + studyHours);

  // Find and update in array
  const index = this.dailyActivities.findIndex(
    (activity) => activity.date.getTime() === today.getTime()
  );
  if (index !== -1) {
    this.dailyActivities[index] = dailyActivity;
  }

  await this.checkAndUpdateAchievements();
  await this.save();
  return this;
};

streakSchema.methods.checkAndUpdateAchievements = async function () {
  const achievementTypes = [
    { type: "7DayStreak", condition: () => this.currentStreak >= 7 },
    { type: "30DayStreak", condition: () => this.currentStreak >= 30 },
    {
      type: "50LessonsCompleted",
      condition: () => this.totalLessonsCompleted >= 50,
    },
    {
      type: "5CoursesCompleted",
      condition: () => this.totalCoursesCompleted >= 5,
    },
    { type: "100StudyHours", condition: () => this.totalStudyHours >= 100 },
  ];

  const newAchievements = achievementTypes
    .filter(({ type, condition }) => condition() && !this.hasAchievement(type))
    .map(({ type }) => ({ type, achievedDate: new Date() }));

  this.achievements.push(...newAchievements);
};

streakSchema.methods.hasAchievement = function (achievementType) {
  return this.achievements.some((a) => a.type === achievementType);
};

streakSchema.statics.getOrCreateStreak = async function (userId) {
  let streak = await this.findOne({ userId });
  if (!streak) {
    streak = new this({ userId });
    await streak.save();
  }
  return streak;
};

// Add these methods to your streakSchema.methods in the Streak model file

streakSchema.methods.getCurrentTwoWeekPeriod = function () {
  const joinDate = moment(this.createdAt).startOf("day");
  const today = moment().startOf("day");

  // Start the period from the join date
  let periodStart = moment(joinDate);

  // If more than 2 weeks have passed since joining, move the start date forward in 2-week increments
  while (periodStart.clone().add(2, "weeks").isBefore(today)) {
    periodStart.add(2, "weeks");
  }

  const periodEnd = periodStart.clone().add(13, "days").endOf("day");

  return { start: periodStart.toDate(), end: periodEnd.toDate() };
};

streakSchema.methods.getTwoWeeksData = function (startDate, endDate) {
  const twoWeeksData = [];
  const start = moment(startDate);
  const end = moment(endDate);

  for (let date = start.clone(); date.isSameOrBefore(end); date.add(1, "day")) {
    const activity = this.dailyActivities.find((a) =>
      moment(a.date).isSame(date, "day")
    );

    twoWeeksData.push({
      date: date.format("YYYY-MM-DD"),
      hasActivity: !!activity,
      lessonsCompleted: activity ? activity.lessonsCompleted : 0,
      coursesCompleted: activity ? activity.coursesCompleted : 0,
      studyHours: activity ? activity.studyHours : 0,
    });
  }

  return twoWeeksData;
};

streakSchema.methods.getYearlyStreakData = function (year = null) {
  const joinDate = moment(this.createdAt).startOf("day");
  const today = moment().startOf("day");
  const targetYear = year || today.year();
  const startOfYear = moment(`${targetYear}-01-01`).startOf("year");

  const monthlyData = [];

  for (let month = 0; month < 12; month++) {
    const currentMonth = moment(startOfYear).add(month, "months");
    const monthStart = currentMonth.clone().startOf("month");
    const monthEnd = currentMonth.clone().endOf("month");

    const dailyData = [];
    let monthlyStudyHours = 0;

    for (let day = 1; day <= currentMonth.daysInMonth(); day++) {
      const currentDate = moment(
        `${targetYear}-${month + 1}-${day}`,
        "YYYY-MM-DD"
      );

      if (
        currentDate.isSameOrAfter(joinDate) &&
        currentDate.isSameOrBefore(today)
      ) {
        const activity = this.dailyActivities.find((a) =>
          moment(a.date).isSame(currentDate, "day")
        );

        const dailyStudyHours = activity
          ? formatNumber.round(activity.studyHours)
          : 0;
        monthlyStudyHours += dailyStudyHours;

        dailyData.push({
          date: currentDate.format("YYYY-MM-DD"),
          hasActivity: activity
            ? activity.lessonsCompleted > 0 ||
              activity.coursesCompleted > 0 ||
              dailyStudyHours > 0
            : false,
          lessonsCompleted: activity ? activity.lessonsCompleted : 0,
          coursesCompleted: activity ? activity.coursesCompleted : 0,
          studyHours: dailyStudyHours,
        });
      }
    }

    monthlyData.push({
      month: currentMonth.format("YYYY-MM"),
      activeDays: dailyData.filter((day) => day.hasActivity).length,
      totalDays: currentMonth.daysInMonth(),
      lessonsCompleted: dailyData.reduce(
        (sum, day) => sum + day.lessonsCompleted,
        0
      ),
      coursesCompleted: dailyData.reduce(
        (sum, day) => sum + day.coursesCompleted,
        0
      ),
      studyHours: formatNumber.round(monthlyStudyHours),
      dailyData,
    });
  }

  return monthlyData;
};

streakSchema.methods.hasPreviousYearData = function (currentYear) {
  const previousYear = currentYear - 1;
  const firstDayOfPreviousYear = moment(`${previousYear}-01-01`).startOf("day");
  return this.dailyActivities.some(
    (activity) =>
      moment(activity.date).isSameOrAfter(firstDayOfPreviousYear) &&
      moment(activity.date).isBefore(`${currentYear}-01-01`)
  );
};

streakSchema.methods.getWeekData = function (year, weekNumber) {
  const startOfWeek = moment().year(year).week(weekNumber).startOf("week");
  const endOfWeek = moment().year(year).week(weekNumber).endOf("week");

  const weekData = [];

  for (
    let date = startOfWeek.clone();
    date.isSameOrBefore(endOfWeek);
    date.add(1, "day")
  ) {
    const activity = this.dailyActivities.find((a) =>
      moment(a.date).isSame(date, "day")
    );

    weekData.push({
      date: date.format("YYYY-MM-DD"),
      hasActivity: !!activity,
      lessonsCompleted: activity ? activity.lessonsCompleted : 0,
      coursesCompleted: activity ? activity.coursesCompleted : 0,
      studyHours: activity ? activity.studyHours : 0,
    });
  }

  return weekData;
};

module.exports = mongoose.model("Streak", streakSchema);
