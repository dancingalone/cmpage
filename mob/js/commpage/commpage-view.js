var modulename, id;
var parms = "";
mui.init();

//B页面onload从服务器获取列表数据；
mui.plusReady(function() {
	//仅支持竖屏显示
	plus.screen.lockOrientation("portrait-primary");

	modulename = mui.currentWebview.modulename;
	id = mui.currentWebview.c_id;

	//从服务器获取数据
	getView();
});

/**
 * 从服务器获取表单
 */
function getView() {
	mui.ajax(app.getDomain() + "/Commpage/PageMobGetView", {
		data: {
			modulename: modulename,
			parms: parms,
			c_id: id
		},
		type: "post",
		dataType: 'json',
		timeout: 5000,
		error: function(request) {
			app.toast("服务器获取数据失败！");
		},
		success: function(data) {
			if (data.statusCode == 200) {
				var content = document.body.querySelector('.erp-commpage-view');
				content.innerHTML += data.page;
				if (data.funcDefine !== "") {
					var fun = data.funcDefine;
					var funobj = eval('('+fun+')');
					funobj();
				}
			} else {
				app.toast("数据加载失败请稍后重试！");
			}

			//关闭等待框
			plus.nativeUI.closeWaiting();
			//显示当前页面
			mui.currentWebview.show();
		}
	});
}