<template>
    <div class="cirnotree" ref="tree" @mousewheel="treeScroll" @DOMMouseScroll="treeScroll">
        <div class="tree-box" ref="box" :style="{'padding-right': height/scrollHeight < 1 ? '6px' :''}">
			<div class="tree-list" ref="list" :style="{minWidth: this.listWidth > 0 ? this.listWidth + 'px' : ''}">
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
						<cirno-icon :name="icon(node)" :colorful="realopt.colorIcon" :prefix="realopt.iconPrefix" :icon-class="realopt.iconClass"/>
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
		<div class="scroll-bar-h" ref="scroller-h"  v-if="width/(scrollWidth-12) < 1"
			:style="{'padding-right': fullWidth ? '0' : '6px'}"
		>
            <div class="rail">
                <div class="scroller"
                    @mousedown="dragScrollerH"
					:style="{width: `${scrollerWidth}px`, left: `${left}px`}"
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
				icon: {},
				iconDefault: '',
				colorIcon: false,
				iconPrefix: '',
				iconClass: ''
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
			scrollerWidth: 0,
            scrollTop: 0,
			scrollHeight: 1,
			scrollWidth: 1,
            height: 1,
			width: 1,
			
			top: 0,
			left: 0,

			listWidth: 0,

            alive: true,
            dropNode: null,
            dragNode: null,
			dropNode: null,
			fullHeight: false,
			fullWidth: false,
			// 预设参数
			realopt: {
				icon: {},
				iconDefault: '',
				colorIcon: false,
				iconPrefix: '',
				iconClass: ''
			}
        };
    },
    created(){
		this.realopt = Object.assign(this.realopt, this.opt)
		// 初始化节点信息，构造目录结构（没有也没关系）
		this.data.length > 0 && this.treeInit();
	},
	mounted () {
		// 设置滚动区域
		this.$nextTick(() => {
			// 获取视图大小
			if (this.$refs.tree.parentElement.nodeName === 'BODY') {
				this.$refs.tree.style.height = window.innerHeight + 'px';
				this.$refs.tree.style.width = window.innerWidth + 'px';
			}
			this.listWidth = this.$refs.list.offsetWidth;
			this.setScroller();
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
            return function(node){
				if(!!node.icon) return node.icon;
				const { icon } = this.realopt;
				// 匹配节点和参数是否一致的方法
				const isMatchedNode = (node, optArr) => {
					let matched = true;
					for (let [key, val] of optArr) {
						if (node.hasOwnProperty(key)) {
							const { [key]: nodeVal } = node;
							matched = nodeVal === val;
						} else {
							matched = false;
						}
						if (!matched) break;
					}
					return matched;
				};
				for (let iconClass of Object.keys(icon).reverse()) {
					if(isMatchedNode(node, Object.entries(icon[iconClass]))) {
						return iconClass
					}
				}
				return this.realopt.iconDefault
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
        }
    },
    
};  
</script>