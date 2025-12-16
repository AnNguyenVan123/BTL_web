const chatRoutes = require("./chat.route");

module.exports = (app) => {
  app.use("/chat", chatRoutes);
};
