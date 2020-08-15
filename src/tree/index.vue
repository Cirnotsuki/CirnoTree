<template>
    <div class="cirnotree" ref="tree" :style="{'padding-right': height/scrollHeight < 1 ? '6px' :''}">
        <div class="tree-list" ref="list" @mousewheel="treeScroll" @DOMMouseScroll="treeScroll">
            <div v-for="(node,index) in existList.slice(pos, pos+len)" :key="index" :id="node.id" :index="pos+index"
                class="tree-node" 
                :class="{'tree-first-node': node.sub === 1}"
                :draggable="draggable && !node.dragDisabled"
                :style="{'padding-left': node.deep*32 + 'px'}"
            >
                <div class="tree-text" :class="{'tree-predrop': node.dropReady, 'node-ondrag': node === dragNode}">
                    <div v-for="(order, index) in node.lineList" :key="index"
                        class="tree-line" :class="{'tree-subline':  order === 0}" 
                        :style="{left: `${order*-32-21}px`}"
                    />
                    <span class="tree-expand" :class="{'tree-open': node.expanded}" v-if="node.children.length>0"/>
                    <span v-if="multiple" class="tree-checkbox" :class="{
                        'tree-checked': node.checked,
                        'tree-halfchecked': node.halfcheck,
                    }"/>
                    <cirno-icon :name="icon(node)" :colorful="opt.colorIcon" :prefix="opt.iconPrefix" :icon-class="opt.iconClass"/>
                    <span class="node-title" :class="{'node-selected': node === selectNode}">
                        <input v-if="node.edit" v-model="node.title" v-cirno-focus
                            @input="inputFn($event, node)" 
                            @keyup="inputFn($event, node)" 
                            @blur="inputFn($event, node)"
                            :style="{'width': getInputWidth(node.title)}"
                        />
                        <span v-else class="node-name" v-html="node.title" />
                        <span v-if="node.index > 0" class="node-no" v-html="formNum(node.index)"/>
                    </span>
                </div>
            </div>
        </div>
        <div class="scroll-bar" ref="scroller" v-if="height/scrollHeight < 1"
            :style="{'padding-bottom': fullHeight ? '0' : '6px'}"
        >
            <div class="rail">
                <div class="scroller"
                    @mousedown="dragScroller"
                    :style="{height: `${scrollerHeight}px`, top: `${top}px`}"
                />
            </div>
        </div>
    </div>
</template>

<script>
import "./style/style.less";

import Vue from "vue";
import mainJS from './js/main';
import eventJS from './js/event';
import funcJS from './js/function';
import icon from './icon.vue';
Vue.component('cirno-icon', icon);
Vue.directive("cirno-focus", {
    inserted(el, binding) {
        // 设置原始值
        el.originValue = el.value;
        // 聚焦输入框
        el.focus();
    }
});
export default {
    name: "cirnotree",
    model: {
        prop: "node",
        event: "select"
	},
	mixins: [mainJS, eventJS, funcJS],
    props: {
        data: {
            type: Array,
            default: () => []
		},
		opt: {
			type: Object,
			default: {
				icon: {
					
				}
			}
		},
        draggable: {
            type: Boolean,
            default: false
        },
        multiple: {
            type: Boolean,
            default: false
        },
        halfcheck: {
            type: Boolean,
            default: false
        },
        fullHeight: {
            type: Boolean,
            default: false
        },
        hideroot: {
            type: Boolean,
            default: false
		},
		firstNodeExpand: {
            type: Boolean,
            default: true
        },
    },
    data() {
        return {
            selectNode: null,
			existList: [],
			nodeHeight: 0,
            scrollerHeight: 0,
            scrollTop: 0,
            scrollHeight: 1,
            height: 800,
            top: 0,
            alive: true,
            dropNode: null,
            dragNode: null,
            dropNode: null
        };
    },
    created(){
		// 初始化节点信息，构造目录结构（没有也没关系）
		this.data.length > 0 && this.treeInit();
	},
	mounted () {
		// 设置滚动区域
		this.$nextTick(() => {
			// 获取视图大小
			if (this.$refs.tree.parentElement.nodeName === 'BODY') {
				console.log(window.innerHeight);
				this.$refs.tree.style.height = window.innerHeight + 'px';
				this.$refs.tree.style.width = document.body.offsetWidth + 'px';
			}
			this.setScroller()
			// 抛发事件
        	this.initEvent();
		});
		this.getNodes()
		// this.getCheckedNodes()
		// 刷新一次节点
		// if(this.data.length > 0) this.refresh(true);
        
    },
    computed: {
        pos(){
			let pos = Math.floor(this.scrollTop/this.nodeHeight) + (this.hideroot ? 1 : 0);
            return pos || 0;
        },
        len(){
            return Math.floor(this.height/this.nodeHeight) + 2
        },
        icon() {
            return function(node, name = ''){
				if(!!node.icon) return node.icon;
				const { icon } = this.opt;
				for (let key of Object.keys(icon).reverse()) {
					name = icon[key][JSON.stringify(node[key])] || '';
					if(name.length > 0) break;
				}
				return name
            }
        },
        getInputWidth(){
            return (str, fontSize = 14) => {
                let half = 0;
                let queter = 0
                for(let s of str){
                    if(/\s/.test(s)){
                        queter += 1
                    }
                    if( /\d/.test(s) || /\w/.test(s)){
                        half += 1
                    }
                }
                return `${(str.length*4 -queter*3 - half*2) * fontSize/4 + fontSize}px`
            }
        }
    },
    watch: {
        scrollTop(val){
            this.$refs.list.scrollTop = val % this.nodeHeight;
        },
        $attrs: {
            handler(attrs) {
                this.selectNode = attrs.node
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        ajust(){
            return this.fullHeight
        },
        
        
		
        oldrefresh(deepRefresh){
			let d = +new Date();
            // 深度刷新节点，当节点结构发生变化时或第一次刷新节点时启用
            if(deepRefresh){
                // 重新设置下标
                const reindex = nodeList => {
                    nodeList.forEach((child, index) => {
                        const {children} = child;
                        child.sub = index+1
                        if(!!children && !!children.length){
                            reindex(children)
                        }
                    })
				}
				reindex(this.data[0].children)
                // 刷新所有节点
                this.getNodes().forEach(node => {

                    // 判断是否末位节点
                    if(!node.parentNode){
						node.isLastNode = true;
                    }else{
						node.deep = node.parentNode.deep + 1;
						node.isLastNode = node.sub === node.parentNode.children.length;
					}
					
					// 设置默认属性
					if(!node.hasOwnProperty('check') || !node.hasOwnProperty('visible') || !node.hasOwnProperty('lineList')){
                    	this.setDefaultProperty(node);
					} 
                    // 重置结构线
					node.lineList = [0];
					
                    // 获取结构线列表
                    if(node.deep > 2){
                        // 搜寻节点的所有父节点
                        let parent = node.parentNode;
                        for(let i=1; i<node.deep-1; i++){
                            // 当父节点不是末位节点时，将节点深度添加进结构线列表
                            if(!parent.isLastNode){
                                node.lineList.push(i);
                            }
                            if(!parent.parentNode){
                                break
                            }
                            // 切换父节点
                            parent = parent.parentNode;
                        }
					}
				});
			}
            // 初始化实在列表
			this.existList = [];
            // 获取所有实际存在的节点
            const getExist = node => {
                if(!node) { return }
                // 设置实在标识
                node.visible && this.existList.push(node)
                // 当节点为展开状态且节点拥有子节点时，获取子节点的实在状态
                if(node.expanded && node.children.length){
                    node.children.forEach(child => getExist(child))
                }
            }
            // 获取所有实在节点
			getExist(this.data[0]);
			console.log(`原始构造耗时：${+new Date() - d}ms`);
            // 获取当前高度
            this.height = this.$refs.tree.offsetHeight-(this.fullHeight ? 0 : 6);
            // 实在列表不存在或长度不大于零时跳出（防错）
            if(!this.existList || !this.existList.length){ return }
            // 获取目录高度
            this.scrollHeight = (this.existList.length - (this.hideroot ? 1 : 0)) * this.nodeHeight;
            // 计算比例
            const rate = this.height / this.scrollHeight;
            // 设定滚动条高度
            this.scrollerHeight = Math.max(this.height * rate, 20);
            // 获取滚动条比例
            const scrollRate =  (this.height - this.scrollerHeight) / (this.scrollHeight - this.height);
            // 定位滚动条位置
			this.top = this.scrollTop * scrollRate;
        },
        
        
        
		// 将数字格式化为 -xxx 的格式
		formNum(num) {
			if (num > 99) {
				return `-${num}`;
			}
			if (num > 9) {
				return `-0${num}`;
			}
			return `-00${num}`;
		}
    },
    
};  
</script>