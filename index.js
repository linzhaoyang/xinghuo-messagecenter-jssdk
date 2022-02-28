import axios from "axios";
import paho from "paho-mqtt";

function mqttServer() {
    this.mqtt = {
        client: null,
        userId: '',  //用户id
        appId: '',    //应用id
        topic: [],     //话题编码
        params: {},        //存储客户端配置
        messageUrl: '', //消息接口地址
        options: {      //mqtt配置 
        },
        messageArrivedCallBack: null, //接受消息的回调函数
        connectionSubscribeCallBack: null,//客户端重连成功回调
        connectionLostCallBack: null,
        reSubscribeTime: 2000, //断线重连间隔
        reSubscribeNumber:  1, //重连次数
    }
};
//创建mqtt客户端
mqttServer.prototype._createMqttClient = function () {
    const config = this._getMqttConfig();
    try {
        if (!!config) {
            const { options, topic, appId, userId, messageUrl, reSubscribeTime } = config;
            const { invocationContext } = options;
            const { host, port } = invocationContext;
            //检查必填参数是否欠缺
            if (!host) {
                console.error('Failed to create client, host is null');
                return {};
            } else if (!port) {
                console.error('Failed to create client, port is null');
                return {};
            } else if (!appId) {
                console.error('Failed to create client, appId is null');
                return {};
            } else if (!userId) {
                console.error('Failed to create client, userId is null');
                return {};
            } else if (!messageUrl) {
                console.error('Failed to create client, messageUrl is null');
                return
            } else if (reSubscribeTime < 2000) {
                console.error('Failed to create client, reSubscribeTime must be greater than 2000');
                return {};
            }
            const topicIds = topic.map((item) => {
                return `${item}/${appId}`
            })
            let Client = {};
            //将连接监听转换成使用then与catch来监听
            const promise = new Promise((resolve, reject) => {
                const clientId = `${appId}-${userId}`;
                Client = new paho.Client(host, port, clientId);
                if (!!Client) {
                    //反馈
                    const connect = {
                        onSuccess: (res) => {
                            //注册主题
                            topicIds.forEach(item => {
                                Client.subscribe(item);
                            })
                            // Client.subscribe(topicIds[0]);
                            resolve(res);
                        },
                        onFailure: (err) => {
                            reject(err);
                        }
                    }
                    //组合对象，将配置和反馈时间都组合在一起
                    // Object.assign(parmas, connect,options || this.options);
                    const parmas = {
                        ...connect,
                        ...options || this.options,
                    };

                    parmas.invocationContext.path = Client.path;
                    const newParmas = deepCopy(parmas)
                    _setParams(parmas, this);
                    //连接客户端
                    Client.connect(newParmas);

                }
            })
            this._setMqttClient(Client);
            Client.connectFeedback = promise;
        } else {
            console.error('Failed to create client, Please add client configuration');
        }
    } catch (error) {
        console.error(error);
    }

    return this._getMqttClient();
}
//获取配置
mqttServer.prototype._getMqttConfig = function () {
    return this.mqtt;
}
//设置配置参数
mqttServer.prototype._setMqttConfig = function (parameter) {
    const { options, topic, appId, userId, messageUrl, reSubscribeTime, reSubscribeNumber } = parameter;
    //设置参数
    if (!!messageUrl) _setMessageUrl(messageUrl, this);
    if (!!appId) _setAppId(appId, this);
    if (!!userId) _setUserId(userId, this);
    if (!!topic) _setTopic(topic, this);
    if (!!options) _setOptions(options, this);
    if (!!reSubscribeTime) _setReSubscribeTime(reSubscribeTime, this);
    if (!!reSubscribeNumber) _setReSubscribeNumber(reSubscribeNumber, this)
}
//未读改已读
mqttServer.prototype._setMessageStatus = function ({ messageId }) {
    const { userId, messageUrl, appId } = this._getMqttConfig();
    if (!messageId) {
        console.log('messageId not null')
        return;
    }
    if (axios) {
        return axios.get(`${messageUrl}/messageManage/rest/sdk/markread?receiverId=${userId}&messageId=${messageId}&appId=${appId}`, {
            headers: { withCredentials: false }
        })
    } else {
        console.log('axios not introduced')
    }
}
//未读消息数量
mqttServer.prototype._unReadMessageNumber = function () {
    const { userId, appId, topic, messageUrl } = this._getMqttConfig();
    if (axios) {
        return axios.get(`${messageUrl}/messageManage/rest/sdk/count/unread?receiverId=${userId}&appId=${appId}&topicCode=${topic}`, {
            headers: { withCredentials: false }
        })
    } else {
        console.log('axios not introduced')
    }
}
//分页查看消息列表
mqttServer.prototype._viewMessageList = function (data = {}) {
    const { userId, appId, topic, messageUrl } = this._getMqttConfig();
    const { size, page, sendTimeBegin, sendTimeEnd, receipted } = data
    if (axios) {
        const object = {
            receiverId: userId,
            topicCode: topic,
            appId,
            size: size || 10,
            page: page || 0,
            sendTimeBegin,
            sendTimeEnd,
            receipted
        }
        const data = Object.keys(object).map(item => {
            if (object[item] !== null && object[item] !== undefined) {
                return `${item}=${object[item]}`
            }
        }).filter(item => item).join("&")
        return axios.get(`${messageUrl}/messageManage/rest/sdk/page/admin?${data}`, {
            headers: { withCredentials: false }
        })
    } else {
        console.log('axios not introduced')
    }
}

//设置mqtt客户端的options
mqttServer.prototype._setMqttClientOption = function (options) {
    const { client } = this.mqtt;
    this._checkMqttClient(client, () => {
        if (!!options && typeof options === 'object') {
            const parmas = {};
            Object.assign(parmas, this.options, options || {});
            if (Object.keys(options).length > 0) {
                if (!!parmas.invocationContext) {
                    parmas.invocationContext.path = client.path;
                }
                client.connect(parmas);
            } else {
                console.log('Options is null');
            }
        } else {
            console.log('Options type must be object');
        }
    })
}

//获取mqtt的Client对象
mqttServer.prototype._getMqttClient = function () {
    let client = null;
    this._checkMqttClient(this.mqtt.client, () => {
        client = this.mqtt.client;
    })
    return client;
}
//设置mqtt的Client对象
mqttServer.prototype._setMqttClient = function (client) {
    if (typeof client === 'object' || Object.keys(client).length !== 0) {
        this.mqtt.client = client;
    } else {
        console.error('clienttype must be object');
    }
}
//获取mqtt的options
mqttServer.prototype._getMqttOptions = function () {
    return this.mqtt.options;
}

//检查是Client对象是否为空对象
mqttServer.prototype._checkMqttClient = function (client, success, error) {
    if (typeof client === 'object' || Object.keys(client).length !== 0) {
        if (!!success) success();
    } else {
        if (!!error) error();
        console.error('Client is null');
    }
}

//查询是否有权限接收消息
function searchAudit(params, config) {
    return axios.get(`${config.messageUrl}/messageManage/rest/sdk/canshow/${params.id}/${config.userId}`, {
        headers: { withCredentials: false }
    })
}


//监听事件
mqttServer.prototype._on = function (name, callback) {
    const client = this._getMqttClient();
    const { userId, options, reSubscribeNumber, messageUrl } = this._getMqttConfig();
    if (!!client) {
        try {
            switch (name) {
                //客户端丢失
                case 'connectionLost':
                    let time = null; //心跳定时器
                    let number = 0; //重连次数
                    client.onConnectionLost = ((params) => {
                        clearInterval(time);
                        callback(params);
                        setConnectionLostCallBack(callback, this)
                        //自动断线重连
                        const { connectionSubscribeCallBack, messageArrivedCallBack, connectionLostCallBack } = this._getMqttConfig();
                        if (options && options.invocationContext && options.invocationContext.resubscribe === true) {
                            if (number <= reSubscribeNumber) {
                                this._reSubscribe((state, heartbeatCheckTime) => {
                                    if (state !== null) {
                                        connectionSubscribeCallBack(state);
                                        //重新绑定接收消息
                                        if (!!state) {
                                            number = 0;
                                            this._on('messageArrived', messageArrivedCallBack);
                                            this._on('connectionLost', connectionLostCallBack);
                                        }
                                        clearInterval(time);
                                    }
                                    if (!!heartbeatCheckTime) time = heartbeatCheckTime;
                                });
                                number++;
                            } else {
                                connectionSubscribeCallBack(false);
                                clearInterval(time);
                                number = 0;
                            }
                        }

                    })
                    break;
                //消息接收
                case 'messageArrived':
                    client.onMessageArrived = ((params) => {
                        if (params.payloadString) {
                            try {
                                const payload = JSON.parse(params.payloadString);
                                if (payload.receiverId === 'SOME_USER') {
                                    searchAudit(payload, this._getMqttConfig()).then((res) => {
                                        if (res.data.data) {
                                            callback(payload);
                                        }
                                    }).catch((error) => {
                                        callback(error);
                                    })
                                } else if (payload.receiverId === 'ALL_USER' || payload.receiverId === userId) {
                                    callback(payload);
                                } 
                            } catch (error) {
                                console.log(error)
                                callback(params);
                            }
                        }
                    })
                    setMessageArrivedCallBack(callback, this);
                    break;
                //客户端重连
                case 'connectionSubscribe':
                    setConnectionSubscribeCallBack(callback, this);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log(error)
        }
    } else {
        console.error('Client is null');
    }
}

//手动重新连接方法
mqttServer.prototype._reSubscribe = function (callback) {
    const client = this._getMqttClient();
    //重连
    reSubscribe(this);
    if (callback) {
        let status = 0; //心跳检查次数
        const heartbeatCheckTime = HeartbeatCheck(client, (state) => {
            if (status === 0) {
                callback(null, heartbeatCheckTime);
            }
            if (!!state) {
                //心跳检查10次连接成功后返回成功
                if (status >= 5) {
                    callback(true);
                }
                status++;
            } else {
                callback(null);
            }
        })
    }
}
//断线重连
function reSubscribe(_this) {
    const Client = _this._getMqttClient();
    const { params, reSubscribeTime } = _this._getMqttConfig();
    //连接客户端
    setTimeout(() => {
        const newParmas = deepCopy(params);
        try {
            Client.connect(newParmas);
        } catch (error) {
            console.log(error);
        }
    }, reSubscribeTime);
}
/**
 * 心跳检查
*/
function HeartbeatCheck(client, callback) {
    return setInterval(() => {
        callback(client.isConnected());
    }, 1000);
}
/**
 * 深拷贝对象
*/
function deepCopy(obj) {
    if (!!obj) {
        var result = Array.isArray(obj) ? [] : {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    result[key] = deepCopy(obj[key]);   //递归复制
                } else {
                    result[key] = obj[key];
                }
            }
        }
        return result;
    } else {
        return obj
    }
}
//设置消息接口地址
function _setMessageUrl(url, _this) {
    if (typeof url === 'string') {
        _this.mqtt.messageUrl = url;
    } else {
        console.error('messageUrl type must be string');
    }
}
//设置消息接口地址
function _setOptions(options, _this) {
    if (typeof options === 'object') {
        _this.mqtt.options = options;
    } else {
        console.error('options type must be object');
    }
}
//设置 appId
function _setAppId(appId, _this) {
    if (typeof appId === 'string') {
        _this.mqtt.appId = appId;
    } else {
        console.error('appId type must be string');
    }
}
//设置 userId
function _setUserId(userId, _this) {
    if (typeof userId === 'string') {
        _this.mqtt.userId = userId;
    } else {
        console.error('userId type must be string');
    }
}
//设置 topic
function _setTopic(topic, _this) {
    if (typeof topic !== 'object') {
        console.error('topic type must be Array');
    } else if (typeof topic === 'object' && topic.length === 0) {
        console.error('topic is null Array');
    } else {
        _this.mqtt.topic = topic;
    }
}
//设置 params 
function _setParams(params, _this) {
    if (typeof params === 'object') {
        _this.mqtt.params = params;
    } else {
        console.error('params type must be object');
    }
}
//设置 reSubscribeTime
function _setReSubscribeTime(reSubscribeTime, _this) {
    if (typeof reSubscribeTime === 'number') {
        _this.mqtt.reSubscribeTime = reSubscribeTime;
    } else {
        console.error('reSubscribeTime type must be number');
    }
}
//设置 reSubscribeNumber
function _setReSubscribeNumber(reSubscribeNumber, _this) {
    if (typeof reSubscribeNumber === 'number') {
        _this.mqtt.reSubscribeNumber = reSubscribeNumber;
    } else {
        console.error('reSubscribeNumber type must be number');
    }
}
//设置消息接收的回调
function setMessageArrivedCallBack(callback, _this) {
    if (typeof callback === 'function') {
        _this.mqtt.messageArrivedCallBack = callback
    } else {
        console.error('messageArrivedCallBack must be function');
    }
}
//设置客户端重新连接的回调
function setConnectionSubscribeCallBack(callback, _this) {
    if (typeof callback === 'function') {
        _this.mqtt.connectionSubscribeCallBack = callback
    } else {
        console.error('connectionSubscribeCallBack must be function');
    }
}
//设置客户端重新连接的回调
function setConnectionLostCallBack(callback, _this) {
    if (typeof callback === 'function') {
        _this.mqtt.connectionLostCallBack = callback
    } else {
        console.error('connectionLostCallBack must be function');
    }
}

export default mqttServer