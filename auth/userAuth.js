const isLogin = async (req, res, next) => {
    try {
      if (req.session.user_id||req.authenticate) {
        next();
      } else {
        res.redirect("/wizcart");
      }
    } catch (error) {
      console.error("Error in isLogin middleware:", error.message);
      next(error); 
    }
  };
  
  const isLogout = async (req, res, next) => {
    try {
        if (!req.session || !req.session.user_id) {
       
            next();
      } else {
        res.redirect("/home");
      }
    } catch (error) {
      console.error("Error in isLogout middleware:", error.message);
      next(error);
    }
  };
  
  
  module.exports = {
    isLogin,
    isLogout,
  };
  