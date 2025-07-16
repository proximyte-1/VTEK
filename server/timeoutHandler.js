// server/timeoutHandler.js
const TIMEOUT_DURATION = 2000; // 2 seconds

const timeoutHandler = (req, res, next) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({ message: "Request timeout. Please try again." });
    }
  }, TIMEOUT_DURATION);

  res.on("finish", () => clearTimeout(timer)); // clear if completed
  res.on("close", () => clearTimeout(timer)); // clear on client disconnect

  next();
};

export default timeoutHandler;
