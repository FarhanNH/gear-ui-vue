<template>
  <ul
    v-if="treeNodes.length > 0"
    :role="isRoot ? 'tree' : 'group'"
    class="secret-tree"
    :class="{ 'secret-tree--root': isRoot, 'secret-tree--nested': !isRoot }"
  >
    <li
      v-for="node in treeNodes"
      :key="node.segment"
      role="treeitem"
      :aria-expanded="node.isLeaf ? undefined : expandedNodes.has(node.segment)"
      :aria-selected="node.isLeaf ? undefined : undefined"
      class="secret-tree__item"
    >
      <!-- Branch node (has children) -->
      <button
        v-if="!node.isLeaf"
        class="secret-tree__node secret-tree__node--branch"
        :tabindex="0"
        @click="toggleNode(node.segment)"
        @keydown.enter.prevent="toggleNode(node.segment)"
        @keydown.space.prevent="toggleNode(node.segment)"
      >
        <span class="secret-tree__icon" aria-hidden="true">
          {{ expandedNodes.has(node.segment) ? '📂' : '📁' }}
        </span>
        <span class="secret-tree__chevron" aria-hidden="true">
          {{ expandedNodes.has(node.segment) ? '▾' : '▸' }}
        </span>
        <span class="secret-tree__label">{{ node.segment }}</span>
      </button>

      <!-- Leaf node (clickable secret path) -->
      <button
        v-else
        class="secret-tree__node secret-tree__node--leaf"
        :tabindex="0"
        @click="$emit('select', node.fullPath)"
        @keydown.enter.prevent="$emit('select', node.fullPath)"
        @keydown.space.prevent="$emit('select', node.fullPath)"
      >
        <span class="secret-tree__icon" aria-hidden="true">📄</span>
        <span class="secret-tree__label">{{ node.segment }}</span>
      </button>

      <!-- Recursive child tree -->
      <SecretTree
        v-if="!node.isLeaf && expandedNodes.has(node.segment)"
        :paths="node.childPaths"
        :prefix="node.fullPath"
        @select="$emit('select', $event)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    paths: string[]
    prefix?: string
  }>(),
  {
    prefix: '',
  }
)

const emit = defineEmits<{
  select: [path: string]
}>()

/** True when this is the root instance (no prefix given). */
const isRoot = computed(() => props.prefix === '')

/** Tracks which branch segments are currently expanded. */
const expandedNodes = ref<Set<string>>(new Set())

function toggleNode(segment: string): void {
  if (expandedNodes.value.has(segment)) {
    expandedNodes.value.delete(segment)
  } else {
    expandedNodes.value.add(segment)
  }
  // Trigger reactivity — Sets are not deeply reactive in Vue 3 without this
  expandedNodes.value = new Set(expandedNodes.value)
}

interface TreeNode {
  /** The segment label shown in the UI (last path component at this level). */
  segment: string
  /** The full path up to and including this segment. */
  fullPath: string
  /** True when this node is a leaf (no further children). */
  isLeaf: boolean
  /** Child paths (only populated for branch nodes). */
  childPaths: string[]
}

/**
 * Builds a flat list of tree nodes for the current level.
 *
 * Algorithm:
 * 1. For each path, strip the leading prefix to obtain the relative portion.
 * 2. Extract the first segment of the relative portion.
 * 3. Group paths by that first segment.
 * 4. A group is a leaf when it contains exactly one path and that path has no
 *    further segments (i.e. the relative portion IS the segment itself).
 */
const treeNodes = computed<TreeNode[]>(() => {
  const base = props.prefix === '' ? '' : props.prefix + '/'

  // Only keep paths that start with (or equal) the current base
  const relativePaths = props.paths
    .filter((p) => base === '' || p.startsWith(base))
    .map((p) => (base === '' ? p : p.slice(base.length)))
    .filter((p) => p.length > 0)

  // Group by first segment
  const groups = new Map<string, string[]>()
  for (const rel of relativePaths) {
    const slashIdx = rel.indexOf('/')
    const segment = slashIdx === -1 ? rel : rel.slice(0, slashIdx)
    if (!groups.has(segment)) {
      groups.set(segment, [])
    }
    groups.get(segment)!.push(rel)
  }

  const nodes: TreeNode[] = []
  for (const [segment, relatives] of groups) {
    const fullPath = base === '' ? segment : props.prefix + '/' + segment

    // It's a leaf when every member of the group IS just the segment itself
    // (no deeper path components).
    const isLeaf = relatives.every((r) => r === segment)

    // The child paths passed to the recursive component are the original full paths.
    const childPaths = isLeaf
      ? []
      : props.paths.filter((p) => p.startsWith(fullPath + '/') || p === fullPath)

    nodes.push({ segment, fullPath, isLeaf, childPaths })
  }

  // Sort: branches first, then leaves, both alphabetically
  nodes.sort((a, b) => {
    if (a.isLeaf !== b.isLeaf) return a.isLeaf ? 1 : -1
    return a.segment.localeCompare(b.segment)
  })

  return nodes
})
</script>

<style scoped>
.secret-tree {
  list-style: none;
  margin: 0;
  padding: 0;
}

.secret-tree--nested {
  padding-left: 1.25rem;
  border-left: 1px solid rgba(128, 128, 128, 0.2);
  margin-left: 0.5rem;
}

.secret-tree__item {
  display: flex;
  flex-direction: column;
}

.secret-tree__node {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.25rem 0.4rem;
  margin: 1px 0;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
  color: inherit;
  transition: background-color 0.15s ease;
}

.secret-tree__node:hover {
  background-color: rgba(128, 128, 128, 0.12);
}

.secret-tree__node:focus-visible {
  outline: 2px solid #4f8ef7;
  outline-offset: 1px;
}

.secret-tree__node--branch {
  font-weight: 500;
}

.secret-tree__node--leaf {
  font-weight: 400;
}

.secret-tree__icon {
  font-size: 0.85em;
  flex-shrink: 0;
}

.secret-tree__chevron {
  font-size: 0.7em;
  flex-shrink: 0;
  opacity: 0.6;
}

.secret-tree__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
