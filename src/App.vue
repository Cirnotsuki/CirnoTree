<template>
	<div class="cirno-tree-test-body">
		<div class="cirno-tree-test">
			<tree :data="data" ref="tree" :opt="opt" v-model="selected" 
				multiple
				halfcheck
				draggable
			/>
		</div>
		<div class="options">
			<button @click="addNode()">增加节点</button>
			<button @click="removeNode()">删除节点</button>
			<button @click="selected.edit = true">重命名</button>
			<button>增加节点</button>
			<button>增加节点</button>
		</div>
		<color-picker />
	</div>
</template>
<script>
import tree from './tree/'
import colorPicker from './color-picker/'
import '@/cirnofont/cirnofont.js';
import "@/cirnofont/cirnofont.css";


export default {
	name: 'app',
	data () {
		return {
			selected: null,
			data: [
				{
					title: '目录一',
					expanded: true,
					children: [
						{
							title: '普通文件夹',
							expanded: true,
							children: [
								{
									title: '私人文件夹',
									personal: true,
									children: [
										{
											title: '文件夹',
											children: [
												{ title: '文档1', icon: 'dotx', id: 3547  },
												{ title: '表格1', icon: 'xlsx'  },
												{ title: 'PPT1', icon: 'pptx'  },
												{
													title: '子文件夹',
													children: [
														{ title: '文档2', icon: 'dotx'  },
														{ title: '表格2', icon: 'xlsx'  },
														{ title: 'PPT2', icon: 'pptx'  },
														{
															title: '子子文件夹',
															children: [
																{ title: '文档3', icon: 'dotx'  },
																{ title: '表格3', icon: 'xlsx'  },
																{ title: 'PPT3', icon: 'pptx'  }
															]
														},
													]
												},
												{ title: '文档4', icon: 'dotx'  },
												{ title: '表格4', icon: 'xlsx'  },
												{ title: 'PPT4', icon: 'pptx'  }
											]
										},
										{ title: '文档5', icon: 'dotx',  },
										{ title: '表格5', icon: 'xlsx',  },
										{ title: 'PPT5', icon: 'pptx',  }
									]
								},
								{ 
									title: '共享文件夹',
									share: true,
									
									children: [
										{
											title: '加密文件夹',
											locked: true,
											children: [
												{ title: '文档6', icon: 'dotx'  },
												{ title: '表格6', icon: 'xlsx'  },
												{ title: 'PPT6', icon: 'pptx'  }
											]
										},
										{ title: '文件7' },
										{ title: '文件7' },
										{ title: '文件7' },
										{ title: '文件8' },
									]
								},
							]
						},
						{ title: '文档8', icon: 'dotx'  },
						{ title: '表格8', icon: 'xlsx'  },
						{ title: 'PPT8', icon: 'pptx'  }
					]
				},
				{
					title: '目录二',
					expanded: true,
					children: [
						{ title: '文档9', icon: 'dotx'  },
						{ title: '表格9', icon: 'xlsx'  },
						{ title: 'PPT9', icon: 'pptx'  }
					]
				},
				{
					title: '目录三',
					expanded: true,
					children: [
						{
							title: '普通文件夹',
							expanded: true,
							children: [
								{
									title: '私人文件夹',
									personal: true,
									children: [
										{ title: '文档10', icon: 'dotx'  },
										{ title: '表格10', icon: 'xlsx'  },
										{ title: 'PPT10', icon: 'pptx'  }
									]
								},
								{ 
									title: '共享文件夹',
									children: [
										{
											title: '加密文件夹',
											locked: true,
											children: [
												{ title: '文档11', icon: 'dotx'  },
												{ title: '表格11', icon: 'xlsx'  },
												{ title: 'PPT11', icon: 'pptx',
													children: [
														{ title: '文档11', icon: 'dotx'  },
														{ title: '表格11', icon: 'xlsx'  },
														{ title: 'PPT11', icon: 'pptx',
															children: [
																{ title: '文档11', icon: 'dotx'  },
																{ title: '表格11', icon: 'xlsx'  },
																{ title: 'PPT11', icon: 'pptx',
																	children: [
																		{ title: '文档11', icon: 'dotx'  },
																		{ title: '表格11', icon: 'xlsx'  },
																		{ title: 'PPT11', icon: 'pptx',
																			children: [
																				{ title: '文档11', icon: 'dotx'  },
																				{ title: '表格11', icon: 'xlsx'  },
																				{ title: 'PPT11', icon: 'pptx',
																					children: [
																						{ title: '文档11', icon: 'dotx'  },
																						{ title: '表格11', icon: 'xlsx'  },
																						{ title: 'PPT11', icon: 'pptx',
																							children: [
																								{ title: '文档11', icon: 'dotx'  },
																								{ title: '表格11', icon: 'xlsx'  },
																								{ title: 'PPT11', icon: 'pptx'  }
																							]   
																						}
																					] 
																				}
																			] 
																		}
																	]  
																}
															]  
														}
													]
												}
											]
										},
										{ title: '文件2' },
									]
								},
							]
						},
						{ title: '文档12', icon: 'dotx'  },
						{ title: '表格12', icon: 'xlsx'  },
						{ title: 'PPT12', icon: 'pptx'  }
					]
				},
			],
			opt: {
				icon: {
					'folder-open': {expanded: true, isLeaf: false},
					'folder': {isLeaf: false},
					'folder-locked': {locked: true},
					'folder-personal': {personal: true},
					'folder-share': {share: true},
				},
				// iconDefault: 'file',
				colorIcon: true,
				iconPrefix: 'cirno-font',
				iconClass: 'cirno-font'
			}
		}
	},
	mounted() {
		window.onresize = e => {
			this.$refs.tree.resize();
		}
	},
	methods: {
		addNode(){
			this.$refs.tree.addNode(this.selected, {title: '新建节点', icon: 'folder'}, true)
		},
		removeNode(){
			if(!this.selected) return;
			this.$refs.tree.removeNode(this.selected, true);
			this.selected = null;
		}
	},
	components: {tree, colorPicker},
}
</script>
<style lang="less" scoped>
	body {
		background-color: #EEE;
	}
	
	.cirno-tree-test-body{
		display: flex;
	}
	.cirno-tree-test{
		display: inline-block;
		width: 1000px;
		height: 900px;
		border: 1px solid #AAA;
		margin-right: 10px;
		// padding: 10px;
	}
	.options{
		display: inline-block;
		button{
			display: block;
			margin-bottom: 10px;
		}

	}
</style>
