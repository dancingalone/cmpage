'use strict';
// +----------------------------------------------------------------------
// | CmPage [ 通用页面框架 ]
// +----------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0
// +----------------------------------------------------------------------
// | Author: defans <defans@sina.cn>
// +----------------------------------------------------------------------

/**
 @module admin.model
 */

/**
 * 登录用户的操作类，提供一些操作t_user,vw_user的方法
 * @class admin.model.privilege
 */
export default class extends think.model.base {

    /**
     * 保存某个角色的权限设置
     * @method  roleSavePrivilege
     * @return {int}  保存的记录条数
     * @param {object} parms  前端递交的参数，包括roleID, 用户ID（多个，以逗号分隔）
     */
    async roleSavePrivilege(parms){
        await this.model('t_role_privilege').where({c_role:parms.roleID}).delete();

        let sql = `insert into t_role_privilege(c_role,c_privilege,c_allow,c_deny) select
			      ${parms.roleID},id,FALSE,TRUE from t_code where id in(${parms.ids})`;
        await this.execute(sql);
    }

    /**
     * 某个角色的权限树
     * @method  roleGetPrivilegeTree
     * @return {Array}  权限记录的数组
     * @param {int} roleID  角色ID
     * @param {rootID} rootID  权限树的根节点ID，可以是权限树的子树的根节点
     */
    async roleGetPrivilegeTree(roleID, rootID){
        rootID = think.isEmpty(rootID) ? 1:rootID;
        let list =await this.model('code').getTreeList(rootID,true);
        let rps = await this.model('t_role_privilege').where({c_role:roleID, c_deny:true}).select();
        for(let privi of list){
            privi.isAllow =true;
            for(let rp of rps){
                if(rp.c_privilege == privi.id){
                    privi.isAllow = false;
                    break;
                }
            }
        }
        return list;
    }

    /**
     * 某个用户定制的的权限树，如果没有则返回该用户所属角色的权限树
     * @method  userGetPrivilegeTree
     * @return {Array}  权限记录的数组
     * @param {int} userID  用户ID
     * @param {int} roleID  角色ID
     * @param {rootID} rootID  权限树的根节点ID，可以是权限树的子树的根节点
     */
    async userGetPrivilegeTree(userID,roleID, rootID){
        rootID = think.isEmpty(rootID) ? 1:rootID;
        let rps = await this.model('t_user_privilege').where({c_user:userID, c_deny:true}).select();
        if(rps.length >0 ) {
            let list =await this.model('code').getTreeList(rootID,true);
            for (let privi of list) {
                privi.isAllow = true;
                for (let rp of rps) {
                    if (rp.c_privilege == privi.id) {
                        privi.isAllow = false;
                        break;
                    }
                }
            }
            return list;
        }else{
            return await this.roleGetPrivilegeTree(roleID,rootID);
        }
    }

}