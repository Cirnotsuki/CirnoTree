export default{
	methods: {
		/**
        * 获取节点的所有祖先目录
        * @param {Object} node 获取节点的所有祖先列表，返回一个集合。
        */
		getAncestors(node) {
			let [arr, parent] = [[], node.parentNode];
			while(!!parent) {
				arr.push(parent);
				parent = parent.parentNode;
			}
			return new Set(arr.reverse())
		},
		/**
        * 判断 target 是不是 node 的祖先节点。
        * @param {Object} node 节点信息。
        * @param {Object} target 对比目标。当 target 是node 的一个祖先节点时，返回 true
        */
		isAncestor(node, target) {
			let parent = node.parentNode;
			while(!!parent) {
				if(parent === target) return true;
				parent = parent.parentNode;
			}
			return false;
		},
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
		/**
        * 刷新目录树视图层的方法
		* @param {Boolean} deepRefresh 深度刷新，当不确定操作结果时，强制进行结构线的重绘，可能会比较消耗性能。；
        */
		refresh(deepRefresh = false){
			this.existList = this.getExistList(deepRefresh);
			this.setScroller();
		},
		getExistList(deepRefresh) {
			let [existList, index] = [[], 0];
			// 重构实在列表
			this.treeErgodic(node => {
				// 深度刷新时重绘结构线
				// deepRefresh && this.treeLineConstructor(node);
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
        * @param {Boolean} treeRefresh 添加后立刻刷新目录，默认为false，批量添加时不建议启动此开关。单次添加时可打开。
        */
        addNode(parent, node, treeRefresh = false){
			// 记录原始深度
            const [oldDeep, len] = [node.deep, parent.children.length];
            // 展开父节点
			this.$set(parent, 'expanded', true);
            // 重定向父节点
            this.$set(node, 'parentNode', parent);
            // 设置默认属性（新建节点时将赋予默认属性）；
            this.setDefaultProperty(node);
            // 重定义深度
			this.$set(node, 'deep', !parent.deep ? 1 : parent.deep + 1);
			// 因为是添加到队列末尾的缘故，所以节点肯定是 LastNode
			node.isLastNode = true;
			// 构造节点的结构线
			this.treeLineConstructor(node);
			// 节点存在后代时，修改所有子节点深度并重构结构线
			node.children.length > 0 && this.treeErgodic(node.children, child => {
				// 重建节点深度
				this.$set(child, 'deep', child.deep - oldDeep + node.deep);
				// 重建结构线
				this.treeLineConstructor(child);
			});
			// 重构节点关系
			let lastNode = parent.children[len - 1];
			// 修改节点的前后关系
			// 节点被推倒后代最后，节点的前一节点为节点的后一节点
			node.prevNode = lastNode;
			// 节点被添加到了队尾，所以不存在下一节点
			node.nextNode = null;
			// 原始末位节点的下一节点改变为被添加进来的节点
			if(!!lastNode) {
				lastNode.nextNode = node;
				// 原先父节点后代的末位节点不再是末位节点
				lastNode.isLastNode = false;
			}
			// 上一节点是目录时重设所有子节点结构线
			if (!!lastNode && lastNode.children.length > 0) {
				this.treeErgodic(lastNode.children, child => this.treeLineConstructor(child));
			}
			// 设置下标
			node.sub = !lastNode ? 1 : lastNode.sub + 1;
			console.log(node.title, node.sub);
            // 插入父节点
			parent.children.push(node);
			// 刷新视图
			treeRefresh && this.refresh();
		},
		/**
        * 添加节点
        * @param {Object} node 待删除的节点
        * @param {Boolean} treeRefresh 删除后立刻刷新目录，默认为false，批量删除时不建议启动此开关。单次删除时可打开。
        * @param {Boolean} callback 回调被删除的节点
        */
		removeNode(node, treeRefresh = false, callback){
			let [nodeSub, len] = [node.sub, node.parentNode.children.length];
			// 重设节点关系
			// 节点移除后，节点的上一节点的下一节点为节点的下一节点
			if (!!node.prevNode) node.prevNode.nextNode = node.nextNode;
			// 节点移除后，节点的下一节点的上一节点为节点的上一节点
			if (!!node.nextNode) node.nextNode.prevNode = node.prevNode;
			// 当节点不是末位节点时，对后续节点进行下标减量
			if (node !== node.parentNode.children[len -1]) {
				let nextNode = node.nextNode;
				while(nextNode) {
					// 下标减量
					nextNode.sub --
					nextNode = nextNode.nextNode;
				}
			}
			console.log('prev.next', !node.prevNode ? null : !node.prevNode.nextNode ? null : node.prevNode.nextNode.title + '/' + node.prevNode.nextNode.sub);
			console.log('prev', !node.prevNode ? null : node.prevNode.title + '/' + node.prevNode.sub);
			console.log('node', !node ? null : node.title + '/' + node.sub);
			console.log('next', !node.nextNode ? null : node.nextNode.title + '/' + node.nextNode.sub);
			console.log('next.prev', !node.nextNode ? null : !node.nextNode.prevNode ? null : node.nextNode.prevNode.title + '/' + node.nextNode.prevNode.sub);


			// 节点为末位节点时，节点移除后节点的上一节点也成为末位节点
			if(node.isLastNode && !!node.prevNode) {
				node.prevNode.isLastNode = true;
				// 节点的末位节点属性发生变化时，重构所有子元素的结构线
				this.treeErgodic(node.prevNode.children, child => this.treeLineConstructor(child));
			}
			
			// 删除节点
			let removedNode = node.parentNode.children.splice(nodeSub - 1, 1);
			// 回调被删除的节点
			!!callback && typeof callback === 'function' && callback(removedNode[0])
			// 刷新视图
			treeRefresh && this.refresh();
		},
		/**
        * 移动节点
        * @param {Object} parent 目标节点
        * @param {Object} node 待移动的节点
        * @param {Boolean} treeRefresh 移动后立刻刷新目录，默认为false，批量移动时不建议启动此开关。单次删除时可打开。
        */
        moveNode(parent, node, treeRefresh = false){
            // 删除原始节点中的节点
            this.removeNode(node, false, delnode => {
				console.log(delnode);
				// 向新节点添加节点
				this.addNode(parent, delnode);
			});
            
			// 刷新视图
			treeRefresh && this.refresh();
        },
        
        delNode(node, parent, i){
            if(node !== parent.children[i]) { return }
            parent.children.forEach((child, index) => {
                child === node && parent.children.splice(index, 1)
            })
        }
	}
}