
Date.prototype.format = function formatDate () {
    let year = this.getFullYear();
    let month = this.getMonth() + 1;
    month = month < 10 ? `0${month}` : month;
    let day = this.getDate();
    day = day < 10 ? `0${day}` : day;
    return `${year}-${month}-${day}`;
}

// 从服务器获取数据
function fetchData(cnt, limit){
    let date = new Date();
    let attempts = 0;
    
    function fetchNext(jjset_set) {
        if (jjset_set.length >= cnt || attempts >= limit) {
            return Promise.resolve(jjset_set);
        }
        
        attempts++;
        return fetch(`../data/data-json/data-${date.format()}.json`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(json => {
                jjset_set.push({
                    date: date.format(),
                    data: json
                });
                date.setDate(date.getDate() - 1);
                return fetchNext(jjset_set);

            })
            .catch(error => {
                console.error('Fetch error:', error);
                date.setDate(date.getDate() - 1);
                return fetchNext(jjset_set);
            });
    }
    
    return fetchNext([]);
}

// 合并基金净值数据
function mergeNet(jjset_set){
    let result = {}
    jjset_set.forEach((jjset,idx) => {
        Object.keys(jjset.data).forEach(key => {
            let val = jjset.data[key];
            if (!result[key]) {
                result[key] = {
                    name: val.name,
                    code: val.code,
                    sgstat: val.sgstat,
                    net:[]
                };
            }
            result[key].net[jjset_set.length-idx-1] = val.net;
        })
    });
    result = Object.values(result);
    result = result.filter(el=>el.net.findIndex(net=>!net) == -1);
    result.forEach(el=>{
        calcNet(el);
    })
    return result;
}

let jj_feature_fn = [
    {
        name: 'netMax',
        text: '净值最大值',
        fn: jj => Math.max(...jj.net)
    },
    {
        name: 'netMin',
        text: '净值最小值',
        fn: jj => Math.min(...jj.net)
    },  
    {
        name: 'netMaxMinusMin',
        text: '15日净值最大值与最小值的差值',
        fn: jj => {
            return ((jj.feature.netMax - jj.feature.netMin)/jj.feature.netMin*100).toFixed(2);
        }
    },
    {
        name: 'netLatestMinusMin',
        text: '15日净值最新值与最小值的差值',
        fn: jj=>{
            return ((jj.net[jj.net.length-1] - jj.feature.netMin)/jj.feature.netMin*100).toFixed(2);
        }
    },
    {
        name: 'netLatestToMax',
        text: '15日净值最新值与最大值的差值',
        fn: jj => {
            return  (jj.feature.netMaxMinusMin - jj.feature.netLatestMinusMin).toFixed(2);
        }
    },
    {
        name: 'latestRate',
        text: '当前涨幅',
        fn: jj=>{
            return ((jj.net[jj.net.length-1] - jj.net[jj.net.length-2])/jj.net[jj.net.length-2]*100).toFixed(2);
        }
    },
    {
        name: 'calc5DayRate',
        text: '5日涨幅',
        fn: jj=>{
            let net = jj.net;
            let latest = net[net.length-1];
            let min = Math.min(net[net.length-1], net[net.length-2], net[net.length-3], net[net.length-4], net[net.length-5]);
            return ((latest - min) / min * 100).toFixed(2);
        }
    },
    {
        name: 'calcUpDayCnt',
        text: '连续上涨天数',
        fn: calcUpDayCnt
    },
    {
        name: 'calc5DayUpRate',
        text: '5日上涨天数比例',
        fn: calc5DayUpRate
    },

];


// 计算净值特征
function calcNet(jj){
    jj.feature = {}
    jj_feature_fn.map(el=>{
        jj.feature[el.name] = el.fn.call(null, jj);
    })
}

// 计算5天上涨的比例
function calc5DayUpRate(jj){
    let net = jj.net;
    let add = Math.max(0, net[net.length-1] - net[net.length-2])
                +Math.max(0, net[net.length-2] - net[net.length-3])
                +Math.max(0, net[net.length-3] - net[net.length-4])
                +Math.max(0, net[net.length-4] - net[net.length-5]);
                
    let min = Math.min(0, net[net.length-1] - net[net.length-2])
                +Math.min(0, net[net.length-2] - net[net.length-3])
                +Math.min(0, net[net.length-3] - net[net.length-4])
                +Math.min(0, net[net.length-4] - net[net.length-5]);

    return (add / (add - min) * 100).toFixed(2);
}

// 计算连续上涨天数
function calcUpDayCnt(jj){
    let cnt = 0;
    for(let i=jj.net.length-1; i=>0; i--){
        if(jj.net[i] >= jj.net[i-1]){
            cnt++;
        }else{
            return cnt;
        }
    }
}
