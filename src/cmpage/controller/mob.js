'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ] 手机APP数据接口
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module cmpage.controller
 */

/**
 * 移动端，业务模块展示及常用操作的URL接口
 * @class cmpage.controller.mob
 */
import Base from './base.js';

export default class extends Base {
    /**
     * 业务模块展示的主界面，分页列表，POST调用： /cmpage/mob/list
     * @method  list
     * @return {json}  包含HTML片段
     */
    async listAction(){
        let vb={};
        let module = this.model("cmpage/module");

        let page ={};
        page.modulename =this.post('modulename');
        if(page.modulename.length >20){
            let error = new Error(page.modulename + " 模块名错误！");
            //将错误信息写到 http 对象上，用于模版里显示
            this.http.error = error;
            return think.statusAction(500, this.http);
        }
        page.pageIndex = this.post('pageIndex');
        page.pageSize = this.post('pageSize');
        page.parmsUrl = this.post('parmsUrl');
        Object.assign(vb,page);

        let md = await module.getModuleByName(page.modulename);
        Object.assign(page,md);

        page.query = this.post();
        page.c_page_size = this.post('pageSize');
        //console.log(page);
        page.user = await this.session('user');
        //    console.log(page);
        if(think.isEmpty(page.id)){
            let error = new Error(page.modulename + " 模块不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }

        let model = this.model(think.isEmpty(page.c_path) ? 'cmpage/page_mob':(page.c_path ==='cmpage/page' ? 'cmpage/page_mob':page.c_path));
        if(think.isEmpty(model)){
            let error = new Error(page.modulename + " 的实现类不存在！");
            this.http.error = error;
            return think.statusAction(500, this.http);
        }

        vb.queryHtml = await model.mobHtmlGetQuery(page);
        //      global.debug(vb.queryHtml);
        let data = await model.getDataList(page);
        //global.debug(data);
        vb.count = data.count;
        vb.listHtml = await model.mobHtmlGetList(page,data.list);
        //global.debug(vb.listHtml);
        vb.statusCode =200;

        return this.json(vb);
    }


    /**
     * 业务模块的编辑页面，调用： /cmpage/mob/edit
     * @method  edit
     * @return {json}  包含HTML片段
     */
    async editAction() {
        let page = await this.model('cmpage/module').getModuleByName(this.post('modulename'));
        page.parmsUrl = JSON.stringify(this.post('parmsUrl'));
        page.editID = this.post("editID");
        //console.log(page);
        page.user = await this.session('user');
        let model = this.model(think.isEmpty(page.c_path) ? 'cmpage/page_mob':(page.c_path ==='cmpage/page' ? 'cmpage/page_mob':page.c_path));
        let editHtml =await model.mobHtmlGetEdit(page);

        return this.json({statusCode:200, editHtml:editHtml});
    }

    /**
     * 保存业务模块记录信息， POST调用： /cmpage/mob/save
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
        if(!think.isEmpty(parms.c_country)){    //地区联动，拆分
            let area = parms.c_country.split(',');
            parms.c_province = area[0];
            parms.c_city = area[1];
            parms.c_country = area[2];
        }
        let ret={statusCode:200,message:'保存成功!',tabid: `page${parms.modulename}`,data:{}};

        let page = await this.model('module').getModuleByName(parms.modulename);
        page.user = await this.session('user');

        let model = this.model(think.isEmpty(page.c_path) ? 'cmpage/page':page.c_path);
        ret.editID = await model.pageSave(page,parms);

        return this.json(ret);
    }

    /**
     * 业务模块的查看页面，一般调用： /cmpage/mob/view
     * @method  view
     * @return {promise}  HTML片段
     */
    async viewAction() {
        let page = await this.model("cmpage/module").getModuleByName(this.get('modulename'));
        page.viewID =parseInt( this.get('id'));
        let model = this.model(think.isEmpty(page.c_path) ? 'cmpage/page':page.c_path);
        let viewHtml = await model.htmlGetView(page)

        this.assign('viewHtml',viewHtml);
        this.assign('page',page);
        return this.display();
    }

}