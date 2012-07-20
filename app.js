/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes');
// Session
var SessionMemory = require('connect-redis')(express);
var app = module.exports = express.createServer();

// alert
var alert = require('./modules/alert/alert');

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
  	layout: false
  });
  
  app.use(express.bodyParser());
  app.use(express.cookieParser());  
  app.use(express.session({
  	secret: 'key',
  	maxAge : new Date(Date.now() + 3600000), //1hours (session's life time) _ (JH/120703) 
  	store: new SessionMemory
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// sessions check
function requiresLogin(req, res, next){
	if ( req.session.user ) {
		next();
	}
	else {
		console.log('session no..');
		res.redirect('/');
	}
}

function requiresAdminLogin(req, res, next){
	if ( req.session.user.role == 'admin' ) {
		next();
	}
	else if ( req.session.user.Id == 'superadmin' ) {
		next();
	}
	else {
		var alert_script = alert.makeAlert('권한이 없습니다.');
		res.render('alert', {
			title : 'Error',
			alert : alert_script
		});
	}
}

function requiresSuperUserLogin(req, res, next){
	if ( req.session.user.Id == 'superadmin' ) {
		next();
	}
	else {
		var alert_script = alert.makeAlert('권한이 없습니다.');
		res.render('alert', {
			title : 'Error',
			alert : alert_script
		});
	}
}

// Routes

//--------------------------------------using
app.get('/', routes.index);

// HTML PAGE RENDERING PART
app.get('/sub01/sub01', routes.html_sub1_1);
app.get('/sub01/sub02', routes.html_sub1_2);
app.get('/sub01/sub03', routes.html_sub1_3);
app.get('/sub01/sub04', routes.html_sub1_4);

app.post('/sessions', routes.session);

app.get('/admin/userlists/:page?', requiresAdminLogin, routes.user_list);
app.get('/user_information/:id', requiresAdminLogin, routes.user_information_view);
app.post('/user_modify', requiresAdminLogin, routes.user_modify);
// Ban user by the admin
app.get('/admin/deleteUser/:id', requiresAdminLogin, routes.delete_user);

app.get('/join', routes.join);
app.post('/makeAccount', routes.makeaccount);
app.get('/checkoverlap/:id', routes.checkoverlap);
app.get('/logout', routes.logout);

app.get('/admin/board_recent_view', requiresAdminLogin, routes.board_recent_view);
app.get('/admin/recent_comment_view', requiresAdminLogin, routes.recent_comment_view);

app.post('/admin/main', routes.admin_check);
app.get('/admin/main', requiresSuperUserLogin, routes.admin_view);
app.get('/admin', routes.admin);

app.post('/admin/board_make', routes.make_board);
app.get('/admin/board_make_form', requiresSuperUserLogin, routes.board_make_form);

// notify group (e-mail, SMS)
app.post('/admin/sendmailView', routes.send_mail_view);	// mail writing form, called from "/admin/userlists"
app.post('/admin/sendmailAction', routes.send_mail_action);	// sending mail action, result alert page, called from "/admin/sendmailView"

app.get('/write/:id', routes.board_write_page);

app.get('/board/:id/:num([0-9]+)/:comm_page?', requiresLogin ,routes.board_contents);
app.get('/board/:id', requiresLogin ,routes.board_post_list);
app.post('/board_write', routes.board_insert);
app.get('/board_modify/:id/:num', routes.board_modify_page);
app.post('/update', routes.board_update);
app.get('/board_delete/:id/:num', routes.board_delete);
app.get('/board_main', requiresLogin ,routes.board_list_page);

app.post('/comment_write', routes.comment_insert);

app.get('/comment_delete/:id/:num/:index', routes.comment_delete);
app.get('/comment_update/:id/:num/:index/:content', routes.comment_update);

//--------------------------------------using
app.post('/board_preview', routes.boardPreview);	// preview contents in a write mode. by Yoon-seop

app.listen(8080, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
