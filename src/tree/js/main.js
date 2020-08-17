export default{
	methods: {
		log() {
			console.log(arguments);
			try {
			  console.log.apply(null, Array.from(arguments))
			} catch (error) {
			  console.log.apply(null, [arguments[0], error])
			}
		},
		// 树状图遍历方法
		treeErgodic(data = this.data, callback) {
			let result = [];
			// 定义参数
			if (arguments.length === 1 && typeof(data) === 'function') {
				callback = data;
				data = this.data;
			}
			let parent;
			let tree = { children: data };
			let stack = [{tree: tree, index: 0}];
			// 遍历节点
			while(stack.length > 0) {
				if(!!tree.children && !!tree.children.length) {
					// 获取栈尾记录的下标
					let index = stack.length > 0 ? stack[stack.length - 1].index : 0;
					// 获取节点
					tree = tree.children[index];
					// 回调节点与父元素
					!!callback && typeof callback === 'function' && callback(tree, parent, index);
					// 创建返回值
					result.push(tree);
					// 压栈
					stack.push({tree: tree, index: 0});
					// 映射父对象
					parent = tree;
				}
				else {
					// 栈尾出栈
					stack.pop();
					if(stack.length > 0) {
						tree = stack[stack.length - 1].tree;
						stack[stack.length - 1].index ++;
						parent = tree;
						if(stack[stack.length - 1].index >= tree.children.length) tree = {};
					}
				}
			}
			return result;
		},
		treeInit() {
			// 初始化节点信息（没有也没关系）
			let d = +new Date()
			// 初始化实在列表
			let [existList, nodeIndex, existIndex] = [[], 0, 0];
			// 遍历节点目录
			this.treeErgodic((node, parentNode, index) => {
				// 父节点没标题时，认为父节点不存在
				if(!!parentNode && !Reflect.has(parentNode, 'title')) {
					parentNode = undefined;
				}
				// 设置父节点
				this.$set(node, 'parentNode', parentNode);
				// 设置节点在目录中的序号
				this.$set(node, 'sub', index+1);
				// 设置初始节点深度，根节点的末位节点由源数据长度决定
				if(!node.parentNode){
					this.$set(node, 'deep', 1);
					this.$set(node, 'isLastNode', index+1 === this.data.length);
				}
				// 设置子节点深度，子节点为父节点最后一位时则为末尾节点
				else{
					this.$set(node, 'deep', node.parentNode.deep + 1);
					this.$set(node, 'isLastNode', index+1 === node.parentNode.children.length);
				}
				// 设置默认属性
				this.setDefaultProperty(node, index, nodeIndex);
				// 关闭叶子节点
				this.$set(node, 'expanded', !node.isLeaf);
				// 构造结构线
				this.treeLineConstructor(node);
				// 获取实在节点, 有回调时添加进实在节点目录
				this.getExist(node, node => {
					// 设置实在节点序号
					this.$set(node, 'existIndex', existIndex);
					// 添加进实在列表
					existList.push(node);
					// 序号增量
					existIndex++
				});
				// id增量
				nodeIndex ++
			});
			this.existList = existList;
			
			console.log(`构造目录耗时：${+new Date() - d}ms`);
		},
		// 构造结构线
		treeLineConstructor(node){
			console.log('treeLineConstructor');
			// 重置结构线
			node.lineList = [0];
			node.lineMap = new Map();
			// 获取结构线列表
			if(node.deep > 1){
				// 搜寻节点的所有父节点
				let [parent, lineIndex] = [node.parentNode, 1];
				for(let i=1; i<node.deep; i++){
					// 当父节点不是末位节点时，将节点深度添加进结构线列表
					if(!parent.isLastNode){
						node.lineMap.set(i, lineIndex);
						node.lineList.push(i);
						lineIndex++
					}
					if(!parent.parentNode){
						break
					}
					// 切换父节点
					parent = parent.parentNode;
				}
			}
		},
		becomeLastNode(node) {
			console.log('becomeLastNode');

			// 修改末位节点信息
			node.isLastNode = true;
			// 节点有后代时修改节点结构线
			node.children.length > 0 && this.treeErgodic(node.children, child => {
				// 删除末位节点位置的结构线
				child.lineList.splice(child.lineMap.get(child.deep - node.deep), 1);
				// 删除映射项
				child.lineMap.delete(child.deep - node.deep);
			});
		},
		nolongerLastNode() {

		},
		// 获取视图层实在节点
		getExist(node, callback, reconstructor){
			// 处理节点隐藏的情况，当节点隐藏且为末位节点时，将最接近节点的可视节点修改为末位节点
			if(node.isLastNode && !node.visible) {
				// 获取节点的所有兄弟节点
				const siblings = !node.parentNode ? this.data : node.parentNode.children;
				// 因为末位节点隐藏了，所以排除末位节点
				let index = siblings.length - 1;
				// 开始反向遍历
				while(index--){
					// 设置节点
					let lastNode = siblings[index];
					// 当遍历到的节点为可视节点时，这个节点将成为队列中的末位节点
					if(lastNode.visible) {
						lastNode.isLastNode = true;
						// 节点有后代元素时，需要修改节点后代的结构线
						lastNode.children.length > 0 && this.treeErgodic(lastNode.children, child => {
							let i = child.lineList.length;
							while(i--) {
								// 删除末位节点位置的结构线
								if(child.lineList[i] === child.deep - node.deep) {
									child.lineList.splice(i, 1);
									break
								}
							}
						});
						break
					}
				}
			}
			// 获取实在节点
			if(!node.parentNode) {
				this.$set(node, 'exist', this.firstNodeExpand);
				!!callback && typeof callback === 'function' && callback(node)
				return
			}
			// 父节点处于展开，非隐藏，且在视图层显示时，该子节点也设置为可在视图层显示
			// 该属性为该节点的子节点做准备，存在节点的父节点未展开或隐藏，节点却展开的情况。
			// 当节点不存在于视图层时，节点的子节点也应该不存在于视图层
			// 虽然可以用遍历所有子节点的方式来实现，不过这种方法耗能更低
			let isExist = node.parentNode.expanded && node.parentNode.exist && node.visible;
			this.$set(node, 'exist', isExist);
			isExist && !!callback && typeof callback === 'function' && callback(node)
		},
		// 设置默认属性
        setDefaultProperty(node, index = 0, nodeIndex = 0){
            // 设置节点 ID
			!node.hasOwnProperty('id') && this.$set(node, 'id', nodeIndex);
			// 设置勾选方法
			!node.hasOwnProperty('check') && this.$set(node, 'check', checked => this.checkNode(node, checked));
			// 设置显示状态
			!node.hasOwnProperty('visible') && this.$set(node, 'visible', true);
			// 设置默认结构线
			!node.hasOwnProperty('lineList') && this.$set(node, 'lineList', [0]);
			// 设置默认后代
			!node.hasOwnProperty('children') && this.$set(node, 'children', []);
			// 设置默认展开
			!node.hasOwnProperty('expanded') && this.$set(node, 'expanded', false);
			// 设置结构线映射表
			!node.hasOwnProperty('lineMap') && this.$set(node, 'lineMap', new Map());
			// 设置上一节点
			!node.hasOwnProperty('prevNode') && this.$set(node, 'prevNode', !node.parentNode ? this.data[index-1] : node.parentNode.children[index-1]);
			// 设置下一节点
			!node.hasOwnProperty('nextNode') && this.$set(node, 'nextNode', !node.parentNode ? this.data[index+1] : node.parentNode.children[index+1]);
			// 设置默认展开
			!node.hasOwnProperty('isRoot') && this.$set(node, 'isRoot', !node.parentNode);
			// 设置叶标记
			this.$set(node, 'isLeaf', !node.children.length);
        },
		// 设置滚动条
		setScroller() {
			const existList = this.existList
			this.nodeHeight = this.$refs.list.querySelector('.tree-node').offsetHeight;
			// 获取当前高度
			this.height = this.$refs.tree.offsetHeight-(this.fullHeight ? 0 : 6);
            // 实在列表不存在或长度不大于零时跳出（防错）
            if(!existList || !existList.length){ return }
            // 获取目录高度
            this.scrollHeight = (existList.length - (this.hideroot ? 1 : 0)) * this.nodeHeight;
            // 计算比例
            const rate = this.height / this.scrollHeight;
            // 设定滚动条高度
            this.scrollerHeight = Math.max(this.height * rate, 20);
            // 获取滚动条比例
            const scrollRate =  (this.height - this.scrollerHeight) / (this.scrollHeight - this.height);
            // 定位滚动条位置
			this.top = this.scrollTop * scrollRate;
		}
	}
}