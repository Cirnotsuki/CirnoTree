export default{
	methods: {
		inputFn(event, node){
            switch (event.type) {
                case 'input':
                    // 根据输入文字修改宽度
                    event.target.style.width = this.getInputWidth(event.target.value)
                    break;
                case 'blur':
                    // 清除编辑状态
                    node.edit = false;
                    // 清除节点名前后空格
                    node.title = node.title.trim();
                    // 抛发事件
                    this.$emit('after-edit', node);
                    break;
                case 'keyup':
                    const value = node.title;
                    // 按下 ESC 时不保存改动
                    if(event.keyCode === 27){
                        // 清除编辑状态
                        node.edit = false;
                    }else if(event.keyCode === 13){
                        // 清除编辑状态
                        node.edit = false;
                        // 抛发事件
                        this.$emit('after-edit', node);
                    }
                    break;
            }
		},
		initEvent() {
			// 获取节点
			const getNode = (e, callback, expand=false) => {
				if(e.target.tagName !== 'SPAN' 
					|| ((/tree-expand/.test(e.target.className) || /tree-checkbox/.test(e.target.className))
					&& !expand)
				)return;
				let node = e.target;
				while(!/tree-node/.test(node.className)){
					node = node.parentElement
				}
				!!callback && typeof callback === 'function' && callback(this.existList[Number(node.getAttribute('index'))])
			}
			this.$refs.tree.onclick = event => {
				getNode(event, node => {
					console.log(node);
					// this.locateNode(node)
					if(/tree-expand/.test(event.target.className)){
						node.expanded = !node.expanded;
						this.refresh()
						this.$emit('node-expand', node)
					}else if(/tree-checkbox/.test(event.target.className)){
						this.checkNode(node);
					}else{
						this.$emit('node-click', node , event)
						this.$emit('select', node)
					}
				}, true)
			}
			this.$refs.tree.ondblclick = event => {
				getNode(event, node => {
					this.$emit('node-dblclick', node , event)
				})
			}
			this.$refs.tree.onmousedown = event => {
				getNode(event, node => {
					this.$emit('node-mousedown', node , event)
				})
			}
			this.$refs.tree.onmouseup = event => {
				getNode(event, node => {
					this.$emit('node-mouseup', node , event)
				})
			}
			// 拖放事件
			this.$refs.tree.ondragstart = event => {
				this.dragNode = this.existList[event.target.getAttribute('index')]
			}
			this.$refs.tree.ondragenter = event => {
				if(!/tree-node/.test(event.target.className) || !this.draggable) return;
				event.preventDefault();
				// 获取节点
				const node = this.existList[event.target.getAttribute('index')]
				// 刷新节点状态
				if(!node.dropDisabled) {
					// 取消上一个节点的预备状态
					!!this.dropNode && this.$set(this.dropNode, 'dropReady', false)
					// 进入预备状态
					this.dragNode !== node && this.$set(node, 'dropReady', true)
				}
				// 记录当前节点
				this.dropNode = node;
			}
			this.$refs.tree.ondragleave = event => {
				if(!/tree-predrop/.test(event.target.className)) return;
				const node = this.existList[event.target.parentElement.getAttribute('index')]
				if(this.dragNode !== node){
					this.$set(node, 'dropReady', false);
				}
			}
			this.$refs.tree.ondragend = event => {
				if(!this.dropNode) return;
				if(this.dropNode.dropDisabled) return;
				if(this.dropNode ===  this.dragNode) return;
				if(this.isAncestor(this.dropNode, this.dragNode)) return;
				// 移动节点
				this.moveNode(this.dropNode, this.dragNode);
				// 取消节点拖放预备状态
				this.$set(this.dropNode, 'dropReady', false);
				// 刷新目录
				this.refresh();
				// 抛发事件
				this.$emit('drag-node-end', this.dragNode, this.dropNode);
			}
		}
	}
}