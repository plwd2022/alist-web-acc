import { HStack, VStack, Text } from "@hope-ui/solid"
import { batch, createEffect, createSignal, For, Show, onMount } from "solid-js"
import { useT, useRouter } from "~/hooks"
import {
  allChecked,
  checkboxOpen,
  isIndeterminate,
  objStore,
  selectAll,
  selectIndex,
  sortObjs,
} from "~/store"
import { OrderBy, StoreObj } from "~/store"
import { Col, cols, ListItem } from "./ListItem"
import { ItemCheckbox, useSelectWithMouse } from "./helper"
import { bus } from "~/utils"

export const ListTitle = (props: {
  sortCallback: (orderBy: OrderBy, reverse?: boolean) => void
  disableCheckbox?: boolean
}) => {
  const t = useT()
  const [orderBy, setOrderBy] = createSignal<OrderBy>()
  const [reverse, setReverse] = createSignal(false)
  createEffect(() => {
    if (orderBy()) {
      props.sortCallback(orderBy()!, reverse())
    }
  })
  const itemProps = (col: Col) => {
    const isCurrentSortCol = () => orderBy() === col.name
    const clickHandler = () => {
      if (col.name === orderBy()) {
        setReverse(!reverse())
      } else {
        batch(() => {
          setOrderBy(col.name as OrderBy)
          setReverse(false)
        })
      }
    }
    return {
      fontWeight: "bold",
      fontSize: "$sm",
      color: "$neutral11",
      textAlign: col.textAlign as any,
      cursor: "pointer",
      onClick: clickHandler,
      tabIndex: 0,
      role: "button",
      "aria-label": t('home.obj.' + col.name) + (isCurrentSortCol() ? (reverse() ? t('global.sorted_descending', ' sorted descending') : t('global.sorted_ascending', ' sorted ascending')) : t('global.sortable_column', ' sortable column')),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          clickHandler()
        }
      },
    }
  }
  return (
    <HStack class="title" w="$full" p="$2">
      <HStack w={cols[0].w} spacing="$1">
        <Show when={!props.disableCheckbox && checkboxOpen()}>
          <ItemCheckbox
            checked={allChecked()}
            indeterminate={isIndeterminate()}
            onChange={(e: any) => {
              selectAll(e.target.checked as boolean)
            }}
          />
        </Show>
        <Text {...itemProps(cols[0])}>{t(`home.obj.${cols[0].name}`)}</Text>
      </HStack>
      <Text w={cols[1].w} {...itemProps(cols[1])}>
        {t(`home.obj.${cols[1].name}`)}
      </Text>
      <Text
        w={cols[2].w}
        {...itemProps(cols[2])}
        display={{ "@initial": "none", "@md": "inline" }}
      >
        {t(`home.obj.${cols[2].name}`)}
      </Text>
    </HStack>
  )
}

const ListLayout = () => {
  const t = useT()
  const { pushHref, to } = useRouter()
  const [focusedIndex, setFocusedIndex] = createSignal(0)
  let containerRef: HTMLDivElement | undefined

  // Array to store refs of ListItem elements
  // However, direct refs to children in a loop are tricky in Solid.
  // We'll rely on aria-activedescendant and querying the DOM element by ID if needed for scrollIntoView.

  createEffect(() => {
    if (objStore.objs.length > 0 && focusedIndex() >= objStore.objs.length) {
      setFocusedIndex(objStore.objs.length - 1)
    } else if (focusedIndex() < 0 && objStore.objs.length > 0) {
      setFocusedIndex(0)
    }
  })

  const focusItem = (index: number) => {
    if (index >= 0 && index < objStore.objs.length) {
      setFocusedIndex(index)
      const itemElement = containerRef?.querySelector(`#list-item-${index}`)
      itemElement?.scrollIntoView({ block: "nearest" })
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (objStore.objs.length === 0) return

    let newIndex = focusedIndex()
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        newIndex = (focusedIndex() + 1) % objStore.objs.length
        break
      case "ArrowUp":
        e.preventDefault()
        newIndex = (focusedIndex() - 1 + objStore.objs.length) % objStore.objs.length
        break
      case "Home":
        e.preventDefault()
        newIndex = 0
        break
      case "End":
        e.preventDefault()
        newIndex = objStore.objs.length - 1
        break
      case "Enter":
        e.preventDefault()
        if (focusedIndex() >= 0 && focusedIndex() < objStore.objs.length) {
          const obj = objStore.objs[focusedIndex()]
          to(pushHref(obj.name))
        }
        break
      case " ": // Spacebar
        e.preventDefault()
        if (checkboxOpen() && focusedIndex() >= 0 && focusedIndex() < objStore.objs.length) {
          const currentObj = objStore.objs[focusedIndex()]
          selectIndex(focusedIndex(), !currentObj.selected)
        }
        break
      default:
        return
    }
    focusItem(newIndex)
  }

  const onDragOver = (e: DragEvent) => {
    const items = Array.from(e.dataTransfer?.items ?? [])
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file") {
        bus.emit("tool", "upload")
        e.preventDefault()
        break
      }
    }
  }
  const { isMouseSupported, registerSelectContainer, captureContentMenu } =
    useSelectWithMouse()
  registerSelectContainer()

  return (
    <VStack
      ref={containerRef}
      role="listbox"
      aria-label={t('global.file_list_description', 'File and folder list')}
      aria-activedescendant={objStore.objs.length > 0 ? `list-item-${focusedIndex()}` : undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onDragOver={onDragOver}
      oncapture:contextmenu={captureContentMenu}
      class="list viselect-container"
      w="$full"
      spacing="$1"
      // When the list itself is focused, ensure the focused item is visible.
      // This might need an effect if focusedIndex changes programmatically elsewhere.
      // For now, keydown handles scrollIntoView.
      onFocus={() => focusItem(focusedIndex())}
    >
      <ListTitle sortCallback={sortObjs} />
      <For each={objStore.objs}>
        {(obj, i) => {
          // Pass isFocused or rely on aria-activedescendant for styling if needed
          return <ListItem obj={obj} index={i()} />
        }}
      </For>
    </VStack>
  )
}

export default ListLayout
