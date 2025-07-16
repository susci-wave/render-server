new Vue({
    el: '#app',
    data: {
        apps:[]
    },
    methods:{
        expand(gid){
            this.apps.forEach(app => {
                if(app.gid === gid){
                    app.viewSub = !app.viewSub;
                }
            });
        },
        openUrl(url ,name){
            if(name == 'U-TIME') return
            window.open(url, '_blank')
        },
    },
    mounted(){
        document.querySelector('.container').style.opacity = 1;
        fetch(window.location.pathname +'svrs')
        .then(res=>res.json())
        .then(res=>{
            res.map(one=>{
                one.viewSub = false;
            })
            this.apps.splice(0,0, ...res);
        }).catch(e=>{
            console.log(e)
        })
    }
})
