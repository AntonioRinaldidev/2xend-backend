const { password } = require("../config/database");

class BaseResponse{
    constructor(isSuccess,message,data = null){
        this.isSuccess = isSuccess;
        this.message = message;
        this.data = data;
    }
    static success(message, data = null) {
        return new BaseResponse(true, message, data);
    }
    static error(message, data = null) {
        return new BaseResponse(false, message, data);
    }
    toJSON() {
        return {
            isSuccess: this.isSuccess,
            message: this.message,
            data: this.data
        };
    }
    toString() {
        const logData = this.data && typeof this.data === 'object' && this.data.passoword ? {...this.data,password  : '**HIDDEN**'} : this.data;
    
        return JSON.stringify({
            isSuccess: this.isSuccess,
            message: this.message,
            data: logData
        });
    }
   
}

module.exports = BaseResponse;