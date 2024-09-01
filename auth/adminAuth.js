const isLogin = async (req, res, next) => {
    try {
      if (req.session && req.session.admin_id) {

        next();

      } else {
        res.redirect("/admin");
      }
    } catch (error) {
      console.error("Error in isLogin middleware:", error.message);
      next(error); 
    }
  };
  
  const isLogout = async (req, res, next) => {
    try {
      if (!req.session || !req.session.admin_id) {
       
        next();

      } else {
      
        res.redirect("/dashboard");

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
  