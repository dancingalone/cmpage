'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.controller
 */

/**
 * 业务模块展示及常用操作的URL接口
 * @class cmpage.controller.page
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 业务模块展示的主界面，分页列表，一般调用： /cmpage/page/list?modulename=xxx
     * @method  list
     * @return {promise}  HTML片段
     */
    async listAction(){
        let vb={};
        let module = this.model("cmpage/module");

        let page ={};
        page.query ={};
        page.modulename =(this.method() === 'get' ? this.get('modulename'):this.post('modulename'));
        if(page.modulename.length >20){
            let error = new Error(page.modulename + " 模块名错误！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        let md = await module.getModuleByName(page.modulename);
        Object.assign(page,md);

        if(this.method() === 'get'){
            page.pageIndex = 1;
            page.pageSize = page.c_page_size;
            //global.debug(http._get);
            page.parmsUrl = JSON.stringify(this.get());
            page.query = this.get();
        }else{
            page.pageIndex = this.post('pageCurrent');
            page.pageSize = this.post('pageSize');
            page.parmsUrl = this.post('parmsUrl');
            page.query = this.post();
        }

        page.user = await this.session('user');
        //    console.log(page);
        if(think.isEmpty(page.id)){
            let error = new Error(page.modulename + " 模块不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        let model = global.model(page.c_path);
        if(think.isEmpty(model)){
            let error = new Error(page.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        vb.queryHtml = await model.htmlGetQuery(page);
        //      global.debug(vb.queryHtml);
        vb.otherHtml = await model.htmlGetOther(page);
        vb.btnHeaderHtml = await model.htmlGetBtnHeader(page);
        //console.log(vb.btnHeaderHtml);
        let data = await model.getDataList(page);
        //global.debug(data);
        vb.count = data.count;
        vb.listHtml = await model.htmlGetList(page,data.list);
        //global.debug(vb.listHtml);

        this.assign('vb',vb);
        this.assign('page',page);
        return this.display();
    }

    /**
     * 模块主界面，导出excel文件，一般调用： /cmpage/page/excel_export?modulename=xxx
     * @method  excelExport
     * @return {file}  excel文件
     */
    async excelExportAction(){
        let module = global.model("cmpage/module");
        let page ={};
        page.query ={};
        page.modulename= this.get('modulename');
        let md = await module.getModuleByName(page.modulename);
        Object.assign(page,md);
        page.query = this.post();
        page.pageIndex = 1;
        page.pageSize = 2000;   //最多2000行
        page.parmsUrl = this.get('parmsUrl');

        page.user = await this.session('user');
//    console.log(page);
        if(think.isEmpty(page.id)){
            let error = new Error(page.modulename + " 模块不存在！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }

        let model = global.model(page.c_path);
        if(think.isEmpty(model)){
            let error = new Error(page.modulename + " 的实现类不存在！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        let data = await model.getDataList(page);
        //global.debug(data);
        let excel = await global.model('cmpage/page_excel').excelExport(data,page);
        //global.debug(vb.listHtml);
        this.header('Content-Type', 'application/vnd.openxmlformats');
        //let filename=[{filename:(think.isEmpty(page.c_alias) ? page.modulename : page.c_alias)}];
        this.header("Content-Disposition", "attachment; filename=" +page.modulename +".xlsx");
        this.end(excel, 'binary');
    }

    /**
     * 业务模块的编辑页面，一般调用： /cmpage/page/edit?modulename=xxx
     * @method  edit
     * @return {promise}  HTML片段
     */
    async editAction() {
        let page = await global.model('cmpage/module').getModuleByName(this.get('modulename'));
        page.parmsUrl = JSON.stringify(this.get());
        page.editID = this.get("id");
        page.user = await this.session('user');
        //global.debug(page);
        let model = global.model(think.isEmpty(page.c_path) ? 'cmpage/page':page.c_path);
        let editHtml =await model.htmlGetEdit(page);

        this.assign('editHtml',editHtml);
        this.assign('page',model.getPageOther(page));
        return this.display();
    }

    /**
     * 业务模块的编辑页面，主从页面，一般调用： /cmpage/page/rec_edit?modulename=xxx
     * @method  recEdit
     * @return {promise}  HTML片段
     */
    async recEditAction() {
        let page = await global.model('cmpage/module').getModuleByName(this.get('modulename'));
        page.parmsUrl = JSON.stringify(this.get());
        page.editID = this.get("id");
        page.user = await this.session('user');
        //global.debug(page);
        let model = global.model(page.c_path);
        let editHtml =await model.htmlGetEdit(page);
        let tabsHtml = model.htmlGetTabs(page);
        let jsHtml = model.htmlGetJS(page);

        this.assign('editHtml',editHtml);
        this.assign('tabsHtml',tabsHtml);
        this.assign('jsHtml',jsHtml);
        this.assign('page',page);
        return this.display();
    }

    /**
     * 保存业务模块记录信息， POST调用： /cmpage/page/save
     * @method  save
     * @return {json}
     */
    async saveAction(){
        let parms =this.post();
        let user = await this.session('user');

        parms.c_user =user.id;
        parms.c_group = (think.isEmpty(parms.c_group) ? user.groupID : parms.c_group);
        parms.c_time = think.datetime();
        parms.c_status= (think.isEmpty(parms.c_status) ? 0 : parms.c_status);
        let ret={statusCode:200,message:'保存成功!',tabid: `page${parms.modulename}`,data:{}};

        let page = await this.model('module').getModuleByName(parms.modulename);
        page.user = await this.session('user');

        let model = global.model(page.c_path);
        ret.data = await model.pageSave(page,parms);

        return this.json(ret);
    }

    /**
     * 业务模块的查看页面，一般调用： /cmpage/page/view?modulename=xxx
     * @method  view
     * @return {promise}  HTML片段
     */
    async viewAction() {
        let page = await this.model("cmpage/module").getModuleByName(this.get('modulename'));
        page.viewID =parseInt( this.get('id'));
        let model = global.model(page.c_path);
        let viewHtml = await model.htmlGetView(page)

        this.assign('viewHtml',viewHtml);
        this.assign('page',page);
        return this.display();
    }

    /**
     * 查找带回页面，一般调用： /cmpage/page/lookup?modulename=xxx&multiselect=false
     * @method  lookup
     * @return {promise}  分页列表数据，字段是否返回的设置 c_isview (模块显示列设置)
     */
    async lookupAction(){
        let http=this.http;
        let vb={};
        let module = this.model("cmpage/module");

        let page ={};
        page.query ={};
        if(this.method() === 'get'){
            page.modulename =http.get('modulename');
            let md = await module.getModuleByName(page.modulename);
            Object.assign(page,md);
            page.pageIndex = 1;
            page.pageSize = page.c_page_size;
            //global.debug(http._get);
            page.parmsUrl = JSON.stringify(http._get);
            page.query = page.parmsUrl;
        }else{
            page.modulename= http.post('modulename');
            let md = await module.getModuleByName(page.modulename);
            Object.assign(page,md);
            page.query = http._post;
            page.pageIndex = http.post('pageIndex');
            page.pageSize = http.post('pageSize');
            page.parmsUrl = http.post('parmsUrl');
        }
        page.user = await this.session('user');

        let model = global.model('cmpage/page_lookup');
        vb.queryHtml = await model.htmlGetQuery(page);
        //global.debug(vb.queryHtml);
        vb.otherHtml = await model.htmlGetOther(page);
        vb.btnHeaderHtml = await model.htmlGetBtnHeader(page);
        //    global.debug(vb.btnHeaderHtml);
        let data = await model.getDataList(page);
        vb.count = data.count;
        vb.listHtml = await model.htmlGetList(page,data.list);
        //    global.debug(vb.listHtml);

        this.assign('vb',vb);
        this.assign('page',page);
        return this.display();
    }

}