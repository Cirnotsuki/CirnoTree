import { refresh } from "less";

export default{
	methods: {
		/**
        * 定位到节点位置
        * @param {Object} node 定位到该节点在目录所在的位置。将会展开所有祖先目录并重构实在列表。
        */
		locateNode(node) {
			// 初始化参数
			let [parent, index, existList] = [node.parentNode, 0, []];
			while(!!parent){
				parent.expanded = true;
				parent = parent.parentNode;
			}
			this.existList = this.getExistList();
			this.setScroller();
			this.treeScroll(node);
		},
		/**
        * 滚动目录
        * @param {Object} event 参数为事件时，按照滚轮参数滚动。参数为节点时，滚动到节点所在位置。使用前请展开节点的所有上级目录并重新构建实在节点列表。
        */
        treeScroll(event){
            const [scrollTop, scrollTopMax, scrollHeight] = [
				/(DOMMouseScroll|wheel)/.test(event.type)
					? this.scrollTop - (event.wheelDeltaY || event.deltaY)
                    : (event.existIndex-1) * this.nodeHeight,
                this.height-this.scrollerHeight,
                this.scrollHeight-this.height
            ];
            // 获取滚动比例
            const scrollRate = scrollTopMax / scrollHeight
            // 获取滚动值
            this.scrollTop = Math.max(0, Math.min(scrollTop, scrollHeight))
            // 获取滑块高度
            this.top = this.scrollTop * scrollRate;
        },
        // 滚动条拖动
        dragScroller(event){            
            const scrollTopMax = this.height-this.scrollerHeight;
            const scrollRate = scrollTopMax/(this.scrollHeight-this.height);
            //算出鼠标相对元素的位置
            const scrollY = event.clientY - event.target.offsetTop;
            window.onmousemove = e => {
                // 获取当前高度
                // this.height = this.$refs.tree.clientHeight;
                // 鼠标移动时清除选区
                window.getSelection().removeAllRanges();
                //移动滚动条
                this.top = Math.min( Math.max(e.clientY - scrollY, 0), scrollTopMax);
                this.scrollTop = this.top / scrollRate;
            }
            window.onmouseup = e => {
                window.onmousemove = null
			}
		},
		// 刷新目录结构
		refresh(){
			this.existList = this.getExistList();
			this.setScroller();
		},
		getExistList() {
			let [existList, index] = [[], 0];
			// 重构实在列表
			this.treeErgodic(node => {
				this.getExist(node, node=> {
					node.existIndex = index;
					existList.push(node);
					index ++;
				});
			});
			return existList;
		},
		/**
        * 根据条件获得节点
        * @param {Object} opt 查询所有符合条件的节点，格式为 {key1: value, key2: value ...}。
        * @param {Array} data 默认传进整个目录，也可传入某节点的 children 属性以查询该节点下所有的子节点。
		* @param {Boolean} fuzzy 模糊查找，为 true 时启用，仅对 opt 中 value 为 String 条件生效。
        */
		getNodes(opt = {}, data = this.data, fuzzy = false) {
			const optArr = Object.entries(opt);
			const hasOpt = optArr.length > 0;
			let res = [];
			// 匹配节点和参数是否一致的方法
			const isMatchedNode = node => {
				let matched = true;
				for (let [key, val] of optArr) {
					if (node.hasOwnProperty(key)) {
						const { [key]: nodeVal } = node;
						if(fuzzy && typeof(nodeVal) === 'string'){
							matched = true
							for(let reg of val.split(' ')){
								if(!new RegExp(reg).test(nodeVal)){
									matched = false;
									break
								}
							}
						}else{
							matched = nodeVal === val;
						}
					} else {
						matched = false;
					}
					if (!matched) break;
				}
				return matched;
			};
			// 无条件时直接返回所有节点列表
			if(!hasOpt) return this.treeErgodic(data);
			// 遍历节点
			this.treeErgodic(data, node => {
				// 获取所有匹配节点
				isMatchedNode(node) && res.push(node);
			});
			// 返回结果
			return res
		},
		/**
        * 获取所有选中的节点
        * @param {Array} data 默认传进整个目录，也可传入某节点的 children 属性以查询该节点下所有的子节点。
        */
		getCheckedNodes(data = this.data){
			return this.getNodes({checked: true}, data)
		},
		/**
        * 选中或取消选中节点，关联修改相关的父节点。该方法写入 node.check(boolean) 来使用该方法；
        * @param {Object} node 需要勾选的节点
        * @param {Boolean} checked true 时为选中节点，false 时则为取消选中。
        */
		checkNode(node, checked){
            // 选中或反选所有子节点
            this.getNodes({}, node.children).forEach(child => {
				if(node.halfcheck){
					this.$set(child, 'checked', false);
					this.$set(child, 'halfcheck', false);
				}else{
					this.$set(child, 'checked', !node.checked)
				}
            });
			// 节点选中时取消半选状态
			if(node.halfcheck){
				this.$set(node, 'halfcheck', false);
			}
			// 切换选中状态
			else{	
				this.$set(node, 'checked', checked === undefined ? !node.checked: checked);
			}
			// 父节点半选
            let parent = node.parentNode;
            while(!!parent){
                const [All, Checked] = [
                    this.getNodes({}, parent.children).length,
                    this.getNodes({checked: true}, parent.children).length
                ]
                if(All === Checked){
                    this.$set(parent, 'halfcheck', false)
                    this.$set(parent, 'checked', true)
                }else if(Checked === 0){
                    this.$set(parent, 'halfcheck', false)
                    this.$set(parent, 'checked', false)
                }else{
                    this.$set(parent, 'halfcheck', true)
                    this.$set(parent, 'checked', false)
                }
                parent = parent.parentNode
			}
			// node.checked && this.$set(node, 'halfcheck', false);
            this.$emit('node-check', node)
		},
		/**
        * 添加节点
        * @param {Object} parent 目标节点
        * @param {Object} node 待添加的节点
        */
        addNode(parent, node, treeRefresh){
            // 展开父节点
            this.$set(parent, 'expanded', true)
            // 记录原始深度
            const oldDeep = node.deep;
            // 重定向父节点
            this.$set(node, 'parentNode', parent);
            // 设置默认属性
            this.setDefaultProperty(node);
            // 重定义深度
            this.$set(node, 'deep', parent.deep +1 || 1)
            // 修改所有子节点深度并重构结构线
            this.getNodes({}, node.children).forEach(child => {
				// 重建节点深度
				this.$set(child, 'deep', child.deep - oldDeep + node.deep);
				// 重建结构线
				this.treeLineConstructor(child);

			});
			this.$set(parent, 'isLeaf', false);
			// 重构结构线
			this.treeLineConstructor(node);
			// 重构节点关系
			let lastNode = parent.children[parent.children.length - 1];
			// 修改前后关系
			node.prevNode = lastNode;
			node.nextNode = null;
			// 上一节点是目录时重设所有子节点结构线
			if (!!lastNode && !lastNode.isLeaf) {
				lastNode.isLastNode = false;
				this.getNodes({}, lastNode.children).forEach(child => {
					// 重构结构线
					this.treeLineConstructor(child);
				});
			}
			// 设置下标
			node.sub = !lastNode ? 1 : lastNode.sub + 1;
			node.isLastNode = true;
            // 插入父节点
			parent.children.push(node);
			// 刷新视图
			treeRefresh && this.refresh();
		},
		// 删除节点
		removeNode(node){
			let nodeSub = node.sub;
			// 当节点不是末位节点时，对后续节点进行下标减量
			if (!node.isLastNode) {
				let nextNode = node.nextNode;
				while(nextNode) {
					// 下标减量
					nextNode.sub --
					nextNode = nextNode.nextNode;
				}
			}
			// 重设节点关系
			if (!!node.prevNode) {
				node.prevNode.isLastNode = node.isLastNode;
				node.prevNode.nextNode = node.nextNode;
			}
			if (!!node.nextNode) {
				node.nextNode.prevNode = node.prevNode;
			}
			
            node.parentNode.children.splice(nodeSub - 1, 1)
        },
        moveNode(parent, node){
            // 删除原始节点中的节点
            this.removeNode(node);
            // 向新节点添加节点
            this.addNode(parent, node);
        },
        
        delNode(node, parent, i){
            if(node !== parent.children[i]) { return }
            parent.children.forEach((child, index) => {
                child === node && parent.children.splice(index, 1)
            })
        }
	}
}