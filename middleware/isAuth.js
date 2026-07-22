// Authentication check middleware - if user not logged in, will be 
// redirect to the login page

export function isAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}