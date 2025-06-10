import { Flex, Grid, Heading, VStack } from "@hope-ui/solid"
import { For, Show, createMemo, createSignal, createEffect, onMount, onCleanup } from "solid-js"
import { ImageItem } from "./ImageItem"
import { local, objStore, selectIndex, checkboxOpen } from "~/store"
import { GridItem } from "./GridItem"
import { StoreObj } from "~/types"
import { useT, useRouter } from "~/hooks"
import { useSelectWithMouse } from "./helper"
import { bus } from "~/utils"

// Helper to add/remove manual-focus class
const updateManualFocus = (containerRef: HTMLElement | undefined, currentFocusedId: string | undefined, previousFocusedId: string | undefined) => {
  if (previousFocusedId) {
    containerRef?.querySelector(`#${previousFocusedId}`)?.classList.remove("manual-focus")
  }
  if (currentFocusedId) {
    containerRef?.querySelector(`#${currentFocusedId}`)?.classList.add("manual-focus")
  }
}

const ImageLayout = (props: { images: StoreObj[] }) => {
  const t = useT()
  const { pushHref, to } = useRouter() // For folder navigation

  // State for Folders Grid
  const [focusedFolderIndex, setFocusedFolderIndex] = createSignal(0)
  let folderGridRef: HTMLDivElement | undefined
  const [numFolderColumns, setNumFolderColumns] = createSignal(1)
  const folderObjs = createMemo(() => objStore.objs.filter((obj) => obj.is_dir))

  const calculateFolderNumColumns = () => {
    if (folderGridRef) {
      const gridWidth = folderGridRef.offsetWidth
      // GridItem minmax is 100px, assuming similar logic to main Grid.tsx for item width.
      // This might need adjustment if GridItem's actual rendered width in this context is different.
      const itemWidth = 100 + 20 // Approximation: 100px min + gap/padding
      const calculatedCols = Math.max(1, Math.floor(gridWidth / itemWidth))
      setNumFolderColumns(calculatedCols)
    }
  }
  onMount(() => {
    calculateFolderNumColumns()
    window.addEventListener("resize", calculateFolderNumColumns)
    setTimeout(calculateFolderNumColumns, 100)
  })
  onCleanup(() => window.removeEventListener("resize", calculateFolderNumColumns))
  createEffect(() => { // Watch for direct changes to objStore that might affect folder count
    folderObjs(); // re-run if folders change
    if (focusedFolderIndex() >= folderObjs().length) {
      setFocusedFolderIndex(Math.max(0, folderObjs().length - 1))
    }
  })
  createEffect(() => { // Update manual focus for folders
    const prevId = folderGridRef?.querySelector(".manual-focus")?.id
    updateManualFocus(folderGridRef, folderObjs().length > 0 ? `grid-item-folder-${focusedFolderIndex()}` : undefined, prevId)
  })


  const focusFolderItem = (index: number) => {
    if (index >= 0 && index < folderObjs().length) {
      setFocusedFolderIndex(index)
      folderGridRef?.querySelector(`#grid-item-folder-${index}`)?.scrollIntoView({ block: "nearest" })
    }
  }

  const handleFolderKeyDown = (e: KeyboardEvent) => {
    const folders = folderObjs()
    if (folders.length === 0) return
    let newIndex = focusedFolderIndex()
    const cols = numFolderColumns()
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); newIndex = Math.min(folders.length - 1, focusedFolderIndex() + cols); break
      case "ArrowUp": e.preventDefault(); newIndex = Math.max(0, focusedFolderIndex() - cols); break
      case "ArrowRight": e.preventDefault(); if ((focusedFolderIndex() + 1) % cols !== 0 || focusedFolderIndex() === folders.length -1) newIndex = Math.min(folders.length - 1, focusedFolderIndex() + 1); break
      case "ArrowLeft": e.preventDefault(); if (focusedFolderIndex() % cols !== 0 || focusedFolderIndex() === 0) newIndex = Math.max(0, focusedFolderIndex() - 1); break
      case "Home": e.preventDefault(); newIndex = 0; break
      case "End": e.preventDefault(); newIndex = folders.length - 1; break
      case "Enter":
        e.preventDefault()
        const folder = folders[focusedFolderIndex()]
        if (folder) to(pushHref(folder.name))
        break
      // Space is handled by GridItem itself if it has focus; here we assume container focus
      default: return
    }
    focusFolderItem(newIndex)
  }

  // State for Images ListBox
  const [focusedImageIndex, setFocusedImageIndex] = createSignal(0)
  let imageListRef: HTMLDivElement | undefined
  // props.images is already filtered for actual image types by the parent component (Folder.tsx)
  // However, the <For> loop in the template iterates objStore.objs and ImageItem filters.
  // For consistency with that loop:
  const imageObjs = createMemo(() => objStore.objs.filter(obj => obj.type !== ObjType.FOLDER && !obj.is_dir));


  createEffect(() => { // Watch for direct changes that might affect image count
    imageObjs(); // re-run if images change
    if (focusedImageIndex() >= imageObjs().length) {
      setFocusedImageIndex(Math.max(0, imageObjs().length - 1))
    }
  })
   createEffect(() => { // Update manual focus for images
    const prevId = imageListRef?.querySelector(".manual-focus")?.id
    updateManualFocus(imageListRef, imageObjs().length > 0 ? `image-item-${imageObjs()[focusedImageIndex()].name}` : undefined, prevId)
  })


  const focusImageItem = (index: number) => {
    const images = imageObjs()
    if (index >= 0 && index < images.length) {
      setFocusedImageIndex(index)
      // ImageItem uses obj.name in its id if we stick to that, or its index in objStore
      // For simplicity, let's assume ImageItem's id is `image-item-${obj.name}` or use the index from imageObjs()
      // The current ImageItem.tsx uses props.index which is from the parent objStore.objs loop.
      // This means the ID on ImageItem is `image-item-${actual_index_in_objStore}`.
      // We need to map focusedImageIndex (index within filtered imageObjs) to actual_index_in_objStore.
      const targetObj = images[index]
      if(targetObj){
        const actualIndexInObjStore = objStore.objs.findIndex(o => o.name === targetObj.name && o.is_dir === targetObj.is_dir);
        imageListRef?.querySelector(`#image-item-${actualIndexInObjStore}`)?.scrollIntoView({ block: "nearest" })
      }
    }
  }

  const handleImageKeyDown = (e: KeyboardEvent) => {
    const images = imageObjs()
    if (images.length === 0) return
    let newIndex = focusedImageIndex()
    switch (e.key) {
      case "ArrowDown": case "ArrowRight": e.preventDefault(); newIndex = (focusedImageIndex() + 1) % images.length; break
      case "ArrowUp": case "ArrowLeft": e.preventDefault(); newIndex = (focusedImageIndex() - 1 + images.length) % images.length; break
      case "Home": e.preventDefault(); newIndex = 0; break
      case "End": e.preventDefault(); newIndex = images.length - 1; break
      case "Enter":
        e.preventDefault()
        const imgEnter = images[focusedImageIndex()]
        if (imgEnter) bus.emit("gallery", imgEnter.name)
        break
      case " ": // Spacebar
        e.preventDefault()
        const imgSpace = images[focusedImageIndex()]
        if (imgSpace) {
          if (checkboxOpen()) {
             const actualIndexInObjStore = objStore.objs.findIndex(o => o.name === imgSpace.name && o.is_dir === imgSpace.is_dir);
             if(actualIndexInObjStore !== -1) selectIndex(actualIndexInObjStore, !imgSpace.selected)
          } else {
            bus.emit("gallery", imgSpace.name)
          }
        }
        break
      default: return
    }
    focusImageItem(newIndex)
  }

  const foldersGrid = createMemo(() => (
    <Grid
      ref={folderGridRef}
      w="$full"
      gap="$1"
      templateColumns="repeat(auto-fill, minmax(100px,1fr))"
      class="image-folders"
      role="grid"
      aria-label={t('global.folder_grid_description', 'Folder grid')}
      tabIndex={folderObjs().length > 0 ? 0 : -1} // Only focusable if it has items
      aria-activedescendant={folderObjs().length > 0 ? `grid-item-folder-${focusedFolderIndex()}` : undefined}
      onKeyDown={handleFolderKeyDown}
      onFocus={() => focusFolderItem(focusedFolderIndex())}
    >
      <For each={folderObjs()}>
        {(obj, i) => {
          // GridItem's id needs to be unique. Using name or a prefix.
          // The original GridItem uses props.index, which is its index in objStore.objs.
          // Here, 'i' is the index in the filtered folderObjs.
          // We need to pass the original index from objStore for GridItem to work as expected with selection.
          const originalIndex = objStore.objs.indexOf(obj)
          return <GridItem obj={obj} index={originalIndex} id={`grid-item-folder-${i()}`} />
        }}
      </For>
    </Grid>
  ))

  const { isMouseSupported, registerSelectContainer, captureContentMenu } = useSelectWithMouse()
  registerSelectContainer() // This might need to be called on each container if they are separate viselect targets

  return (
    <VStack
      // oncapture:contextmenu={captureContentMenu} // Apply to specific focusable containers instead
      // class="viselect-container" // viselect should be on individual containers if needed
      spacing="$2"
      w="$full"
    >
      <Show when={local["show_folder_in_image_view"] === "top"}>
        {foldersGrid()}
      </Show>
      <Show
        when={imageObjs().length > 0} // Use imageObjs for the condition
        fallback={<Heading m="$2">{t("home.no_images")}</Heading>}
      >
        <Flex
          ref={imageListRef}
          w="$full"
          gap="$1"
          flexWrap="wrap"
          class="image-images viselect-container" // viselect if images are selectable
          oncapture:contextmenu={captureContentMenu} // if images have context menu
          role="listbox"
          aria-label={t('global.image_list_description', 'Image list')}
          tabIndex={imageObjs().length > 0 ? 0 : -1} // Only focusable if it has items
          aria-activedescendant={imageObjs().length > 0 ? `image-item-${objStore.objs.findIndex(o=> o.name === imageObjs()[focusedImageIndex()]?.name)}` : undefined}
          onKeyDown={handleImageKeyDown}
          onFocus={() => focusImageItem(focusedImageIndex())}
        >
          {/* The loop for ImageItem should iterate over the same list as imageObjs for focusedImageIndex to align */}
          {/* ImageItem itself filters out non-images, but its props.index is crucial for selection state. */}
          {/* This loop iterates ALL objStore.objs, ImageItem then renders null if not an image. */}
          {/* This means `image-item-${props.index}` IDs are based on original objStore index. */}
          <For each={objStore.objs}>
            {(obj, i) => {
              // ImageItem handles its own rendering condition (type === IMAGE)
              return <ImageItem obj={obj} index={i()} />
            }}
          </For>
        </Flex>
      </Show>
      <Show when={local["show_folder_in_image_view"] === "bottom"}>
        {foldersGrid()}
      </Show>
    </VStack>
  )
}

export default ImageLayout
