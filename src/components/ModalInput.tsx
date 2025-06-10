import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  FormHelperText,
  Box,
} from "@hope-ui/solid"
import {
  createSignal,
  JSXElement,
  Show,
  createEffect,
  onCleanup,
  createMemo,
} from "solid-js"
import { useT } from "~/hooks"
import { notify } from "~/utils"
export type ModalInputProps = {
  opened: boolean
  onClose: () => void
  title: string
  isRenamingFile?: boolean
  onSubmit?: (text: string) => void
  type?: string
  defaultValue?: string
  loading?: boolean
  tips?: string
  topSlot?: JSXElement
  bottomSlot?: JSXElement
  footerSlot?: JSXElement
  onDrop?: (e: DragEvent, setValue: (value: string) => void) => void
}
export const ModalInput = (props: ModalInputProps) => {
  const [value, setValue] = createSignal(props.defaultValue ?? "")
  const t = useT()
  const headerId = createMemo(() => `modal-header-${Math.random().toString(36).substring(2, 9)}`)
  const [inlineError, setInlineError] = createSignal("")
  const errorId = createMemo(() => `modal-error-${Math.random().toString(36).substring(2, 9)}`)

  let inputRef: HTMLInputElement | HTMLTextAreaElement

  const handleFocus = () => {
    // Find the position of the first dot (".") in the value
    const dotIndex = value().lastIndexOf(".")

    setTimeout(() => {
      // If a dot exists and it is not the first character, select from start to dotIndex
      // And it must be a file, not a folder
      if (dotIndex > 0 && props.isRenamingFile) {
        inputRef.setSelectionRange(0, dotIndex)
      } else {
        // If there's no dot or it's the first character, select the entire value
        inputRef.select()
      }
    }, 10) // To prevent default select behavior from interfering
  }

  createEffect(() => {
    if (inputRef) {
      inputRef.focus()
      handleFocus()
    }

    // Cleanup function to clear the selection range before unmounting
    onCleanup(() => {
      if (inputRef) {
        inputRef.setSelectionRange(0, 0)
      }
    })
  })

  createEffect(() => {
    if (!props.opened) {
      setValue("")
      setInlineError("") // Clear error when modal is closed/reopened
    }
  })

  const submit = () => {
    if (!value()) {
      const errorMessage = t("global.empty_input_for_field", { field: t(props.title) }, `${t(props.title)} cannot be empty.`)
      setInlineError(errorMessage)
      notify.warning(t("global.empty_input")) // Keeping this as per instruction
      return
    }
    // Assuming onSubmit might eventually lead to closing the modal, error clearing is handled by props.opened effect or props.onClose.
    // If onSubmit is successful and modal stays open for some reason, an explicit setInlineError("") might be needed here.
    props.onSubmit?.(value())
  }

  const currentOnClose = () => {
    setInlineError("")
    props.onClose()
  }


  return (
    <Modal
      blockScrollOnMount={false}
      opened={props.opened}
      onClose={currentOnClose} // Use wrapped onClose
      initialFocus="#modal-input"
    >
      <ModalOverlay />
      <ModalContent onDrop={(e) => props.onDrop?.(e, setValue)}>
        {/* <ModalCloseButton /> */}
        <ModalHeader id={headerId()}>{t(props.title)}</ModalHeader>
        <ModalBody>
          <Show when={props.topSlot}>{props.topSlot}</Show>
          <Show
            when={props.type === "text"}
            fallback={
              <Input
                id="modal-input"
                type={props.type}
                value={value()}
                aria-labelledby={headerId()}
                aria-invalid={!!inlineError()}
                aria-describedby={inlineError() ? errorId() : (props.tips ? 'modal-tips' : undefined)}
                ref={(el) => (inputRef = el)}
                onInput={(e) => {
                  setValue(e.currentTarget.value)
                  setInlineError("") // Clear error on input
                }}
                onFocus={handleFocus}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submit()
                  }
                }}
              />
            }
          >
            <Textarea
              id="modal-input"
              value={value()}
              aria-labelledby={headerId()}
              aria-invalid={!!inlineError()}
              aria-describedby={inlineError() ? errorId() : (props.tips ? 'modal-tips' : undefined)}
              ref={(el) => (inputRef = el)}
              onInput={(e) => {
                setValue(e.currentTarget.value)
                setInlineError("") // Clear error on input
              }}
              onFocus={handleFocus}
            />
          </Show>
          <Show when={inlineError()}>
            <Box role="alert" id={errorId()} color="$danger11" mt="$1_5" fontSize="$sm">
              {inlineError()}
            </Box>
          </Show>
          <Show when={props.tips}>
            <FormHelperText id="modal-tips">{props.tips}</FormHelperText>
          </Show>
          <Show when={props.bottomSlot}>{props.bottomSlot}</Show>
        </ModalBody>
        <ModalFooter display="flex" gap="$2">
          <Show when={props.footerSlot}>{props.footerSlot}</Show>
          <Button onClick={currentOnClose} colorScheme="neutral">
            {t("global.cancel")}
          </Button>
          <Button loading={props.loading} onClick={() => submit()}>
            {t("global.ok")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
