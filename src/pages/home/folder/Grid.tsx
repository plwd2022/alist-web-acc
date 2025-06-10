import { Grid } from "@hope-ui/solid"
import { createSignal, For, createEffect, onMount, onCleanup } from "solid-js"
import { GridItem } from "./GridItem"
import "lightgallery/css/lightgallery-bundle.css"
import { local, objStore, selectIndex } from "~/store"
import { useSelectWithMouse } from "./helper"
import { useT, useRouter } from "~/hooks"
import { checkboxOpen } from "~/store"

const GridLayout = () => {
  const t = useT()
  const { pushHref, to } = useRouter()
  const [focusedIndex, setFocusedIndex] = createSignal(0)
  let containerRef: HTMLDivElement | undefined
  const [numColumns, setNumColumns] = createSignal(1) // Default to 1, will update

  const calculateNumColumns = () => {
    if (containerRef) {
      const gridWidth = containerRef.offsetWidth
      const itemSizeString = local["grid_item_size"] || "100" // Default item size if not set
      const itemWidth = parseInt(itemSizeString) + 20 // Based on templateColumns
      const calculatedCols = Math.max(1, Math.floor(gridWidth / itemWidth))
      setNumColumns(calculatedCols)
    }
  }

  onMount(() => {
    calculateNumColumns()
    window.addEventListener("resize", calculateNumColumns)
    // Fallback if initial calculation is too early
    setTimeout(calculateNumColumns, 100);
  })

  onCleanup(() => {
    window.removeEventListener("resize", calculateNumColumns)
  })

  createEffect(() => {
    // Recalculate if item size changes from settings
    local["grid_item_size"]; // dependency
    calculateNumColumns();
  });


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
      const itemElement = containerRef?.querySelector(`#grid-item-${index}`)
      itemElement?.scrollIntoView({ block: "nearest" })
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (objStore.objs.length === 0) return

    let newIndex = focusedIndex()
    const cols = numColumns()
    const totalItems = objStore.objs.length

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        newIndex = Math.min(totalItems - 1, focusedIndex() + cols)
        break
      case "ArrowUp":
        e.preventDefault()
        newIndex = Math.max(0, focusedIndex() - cols)
        break
      case "ArrowRight":
        e.preventDefault()
        // Prevent wrapping to next line if at the end of a row, unless it's the last item
        if ((focusedIndex() + 1) % cols !== 0 || focusedIndex() === totalItems -1) {
          newIndex = Math.min(totalItems - 1, focusedIndex() + 1)
        }
        break
      case "ArrowLeft":
        e.preventDefault()
        // Prevent wrapping to previous line if at the start of a row, unless it's the first item
        if (focusedIndex() % cols !== 0 || focusedIndex() === 0) {
           newIndex = Math.max(0, focusedIndex() - 1)
        }
        break
      case "Home":
        e.preventDefault()
        newIndex = 0
        break
      case "End":
        e.preventDefault()
        newIndex = totalItems - 1
        break
      case "Enter":
        e.preventDefault()
        if (focusedIndex() >= 0 && focusedIndex() < totalItems) {
          const obj = objStore.objs[focusedIndex()]
          to(pushHref(obj.name))
        }
        break
      case " ": // Spacebar
        e.preventDefault()
        if (checkboxOpen() && focusedIndex() >= 0 && focusedIndex() < totalItems) {
          const currentObj = objStore.objs[focusedIndex()]
          selectIndex(focusedIndex(), !currentObj.selected)
        }
        break
      default:
        return
    }
    focusItem(newIndex)
  }

  const { isMouseSupported, registerSelectContainer, captureContentMenu } =
    useSelectWithMouse()
  registerSelectContainer()

  return (
    <Grid
      ref={containerRef}
      role="grid"
      aria-label={t('global.file_grid_description', 'File and folder grid')}
      aria-activedescendant={objStore.objs.length > 0 ? `grid-item-${focusedIndex()}` : undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={() => focusItem(focusedIndex())} // Ensure focused item is visible when grid gets focus
      oncapture:contextmenu={captureContentMenu}
      class="viselect-container"
      w="$full"
      gap="$1"
      templateColumns={`repeat(auto-fill, minmax(${
        parseInt(local["grid_item_size"]) + 20
      }px,1fr))`}
    >
      <For each={objStore.objs}>
        {(obj, i) => {
          return <GridItem obj={obj} index={i()} />
        }}
      </For>
    </Grid>
  )
}

export default GridLayout
