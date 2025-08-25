
Date.prototype.format = function formatDate () {
    let year = this.getFullYear();
    let month = this.getMonth() + 1;
    month = month < 10 ? `0${month}` : month;
    let day = this.getDate();
    day = day < 10 ? `0${day}` : day;
    return `${year}-${month}-${day}`;
}
 

// 从服务器获取数据
function fetchData2(cnt, limit){
    let date = new Date();
    let attempts = 0;
    
    function fetchNext(jjdata) {
        if (jjdata.netset.length >= cnt || attempts >= limit) {
            return Promise.resolve(jjdata);
        }
        
        attempts++;
        refreshLog('loading fund net ' + date.format())
        return fetch(`../data/data-json/data-${date.format()}.json`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(json => {
                jjdata.netset.push({
                    date: date.format(),
                    data: json
                });
                date.setDate(date.getDate() - 1);
                return fetchNext(jjdata);

            })
            .catch(error => {
                console.error('Fetch error:', error);
                date.setDate(date.getDate() - 1);
                return fetchNext(jjdata);
            });
    }
    refreshLog('start loading fund')
    return fetch(`../data/data-json/data-all.json`)
            .then(res=>{
                if (res.ok) {
                    return res.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            }).then(jjset=>{
                return fetchNext({
                    jjset: jjset,
                    netset: []
                });
            }).catch(error=>{
                refreshLog('loaded fund error ' + error)
                console.error('Fetch error:', error);
                alert(error)
            })
}
 

// 合并基金净值数据
function mergeNet2(jjset_set){
    jjset_set.netset.forEach((netset, idx)=>{
        Object.keys(netset.data).forEach(key=>{
            let val = netset.data[key];
            if(!jjset_set.jjset[key].net){
                jjset_set.jjset[key].net = [];
            }
            jjset_set.jjset[key].net[jjset_set.netset.length - idx - 1] = val;
        })
    })
    
    let result = Object.values(jjset_set.jjset);
    result = result.filter(el=>el.net.findIndex(net=>!net) == -1);
    result.forEach(el=>{
        // let firstNet = el.net.shift();
        // el.net = el.net.map(net=> ((net-firstNet)/net*100).toFixed(2));
        el.net = el.net.map((net,idx)=>{
            if(idx == 0) return 0;
            return (net - el.net[0])/el.net[0]*100;
        }).map(net=>net.toFixed(2));

        calcNet(el);
    })
    return result;
}

let jj_feature_fn = [
    {
        name: 'rateMax',
        text: '区间高点',
        desc: '区间高点',
        fn: jj => Math.max(...jj.net),
        hide: true
    },
    {
        name: 'rateMin',
        text: '区间低点',
        desc: '区间低点',
        fn: jj => Math.min(...jj.net),
        hide: true
    },
    {
        name: 'rateRange',
        text: '区间幅度',
        desc: '区间高点-区间低点',
        fn: jj => {
            return jj.feature.rateMax - jj.feature.rateMin;
        },
    },
    {
        name: 'curRate2Min',
        text: '当前区间涨幅',
        desc: '昨日涨幅-区间低点',
        fn: jj=>{
            return jj.net[jj.net.length-1] - jj.feature.rateMin;
        }
    },
    {
        name: 'curRate2Max',
        text: '当前区间跌幅',
        desc: '昨日涨幅-区间高点',
        fn: jj => {
            return jj.net[jj.net.length-1] - jj.feature.rateMax;
        }
    },
    {
        name: 'curRate',
        text: '昨日涨幅',
        fn: jj=>{
            return jj.net[jj.net.length-1] - jj.net[jj.net.length-2];
        }
    },
    {
        name: 'day5RateRange',
        text: '5日区间幅度',
        desc: '5日区间高点-5日区间低点',
        fn: jj=>{
            let net = jj.net;
            return Math.max(...net.slice(net.length-5))
                - Math.min(...net.slice(net.length-5));
        }
    },
    {
        name: 'dayUpCnt',
        text: '连涨天数',
        fn: calcUpDayCnt
    },
    {
        name: 'day5UpRateRate',
        text: '5日上涨幅度比例',
        fn: calc5DayRateUpRate
    },
    {
        name: 'day5UpRate',
        text: '5日上涨天数比例',
        fn: calc5DayUpRate
    }
];


// 计算净值特征
function calcNet(jj){
    jj.feature = {}
    jj_feature_fn.map(el=>{
        if(el.fn){
            jj.feature[el.name] = el.fn.call(null, jj);
            if(typeof jj.feature[el.name] == 'number'){
                jj.feature[el.name] = jj.feature[el.name].toFixed(2);
            }
        }
    })
}

// 计算连续上涨天数
function calcUpDayCnt(jj){
    let cnt = 0;
    for(let i=jj.net.length-1; i>0; i--){
        if(jj.net[i] >= jj.net[i-1]){
            cnt++;
        }else{
            return cnt;
        }
    }
}

// 计算5天上涨的比例
function calc5DayRateUpRate(jj){
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

// 计算5天上涨天数比例
function calc5DayUpRate(jj){
    let net = jj.net;
    let upCount = 0;
    for (let i = net.length - 1; i > net.length - 6 && i >= 1; i--) {
        if(jj.net[i] >= jj.net[i-1]){
            upCount++;
        }
    }
    return ((upCount / 5) * 100).toFixed(2);
}