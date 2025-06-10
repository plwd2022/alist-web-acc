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
  VStack,
  Box,
} from "@hope-ui/solid"
import { createSignal, JSXElement, Show, createMemo, createEffect } from "solid-js"
import { useT } from "~/hooks"
import { notify } from "~/utils"
export type ModalTwoInputProps = {
  opened: boolean
  onClose: () => void
  title: string
  onSubmit?: (text1: string, text2: string) => void // Update onSubmit to accept two input texts
  type?: string
  defaultValue1?: string // Update defaultValue to defaultValue1
  defaultValue2?: string // Add defaultValue2 for second input
  loading?: boolean
  tips?: string
  topSlot?: JSXElement
}
export const ModalTwoInput = (props: ModalTwoInputProps) => {
  const [value1, setValue1] = createSignal(props.defaultValue1 ?? "")
  const [value2, setValue2] = createSignal(props.defaultValue2 ?? "")
  const t = useT()
  const headerId = createMemo(() => `modal-header-${Math.random().toString(36).substring(2, 9)}`)

  const [inlineError1, setInlineError1] = createSignal("")
  const [inlineError2, setInlineError2] = createSignal("")
  const errorId1 = createMemo(() => `modal-error1-${Math.random().toString(36).substring(2, 9)}`)
  const errorId2 = createMemo(() => `modal-error2-${Math.random().toString(36).substring(2, 9)}`)

  createEffect(() => {
    if (!props.opened) {
      setValue1(props.defaultValue1 ?? "")
      setValue2(props.defaultValue2 ?? "")
      setInlineError1("")
      setInlineError2("")
    }
  })

  const submit = () => {
    let hasError = false
    if (!value1()) {
      setInlineError1(t("global.empty_input_for_field", { field: t(props.title) + " 1" }, `${t(props.title)} field 1 cannot be empty.`))
      hasError = true
    }
    if (!value2()) {
      setInlineError2(t("global.empty_input_for_field", { field: t(props.title) + " 2" }, `${t(props.title)} field 2 cannot be empty.`))
      hasError = true
    }

    if (hasError) {
      notify.warning(t("global.empty_input")) // General notification
      return
    }
    props.onSubmit?.(value1(), value2())
  }

  const currentOnClose = () => {
    setInlineError1("")
    setInlineError2("")
    props.onClose()
  }

  return (
    <Modal
      blockScrollOnMount={false}
      opened={props.opened}
      onClose={currentOnClose}
      initialFocus="#modal-input1"
    >
      <ModalOverlay />
      <ModalContent>
        {/* <ModalCloseButton /> */}
        <ModalHeader id={headerId()}>{t(props.title)}</ModalHeader>
        <ModalBody>
          <Show when={props.topSlot}>{props.topSlot}</Show>
          <Show
            when={props.type === "text"}
            fallback={
              <VStack spacing="$2">
                <Input
                  id="modal-input1" // Update id to "modal-input1" for first input
                  type={props.type}
                  value={value1()}
                  aria-labelledby={headerId()}
                  aria-invalid={!!inlineError1()}
                  aria-describedby={inlineError1() ? errorId1() : (props.tips ? 'modal-tips' : undefined)}
                  onInput={(e) => {
                    setValue1(e.currentTarget.value)
                    setInlineError1("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit()
                  }}
                />
                <Show when={inlineError1()}>
                  <Box role="alert" id={errorId1()} color="$danger11" mt="$1_5" fontSize="$sm">
                    {inlineError1()}
                  </Box>
                </Show>
                <Input
                  id="modal-input2"
                  type={props.type}
                  value={value2()}
                  aria-labelledby={headerId()}
                  aria-invalid={!!inlineError2()}
                  aria-describedby={inlineError2() ? errorId2() : undefined} // Tips might not apply here or need a separate tips2 prop
                  onInput={(e) => {
                    setValue2(e.currentTarget.value)
                    setInlineError2("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit()
                  }}
                />
                <Show when={inlineError2()}>
                  <Box role="alert" id={errorId2()} color="$danger11" mt="$1_5" fontSize="$sm">
                    {inlineError2()}
                  </Box>
                </Show>
              </VStack>
            }
          >
            <div> {/* Assuming Textarea variant also needs this structure */}
              <Textarea
                id="modal-input1"
                value={value1()}
                aria-labelledby={headerId()}
                aria-invalid={!!inlineError1()}
                aria-describedby={inlineError1() ? errorId1() : (props.tips ? 'modal-tips' : undefined)}
                onInput={(e) => {
                  setValue1(e.currentTarget.value)
                  setInlineError1("")
                }}
              />
              <Show when={inlineError1()}>
                <Box role="alert" id={errorId1()} color="$danger11" mt="$1_5" fontSize="$sm">
                  {inlineError1()}
                </Box>
              </Show>
              <Textarea
                id="modal-input2"
                value={value2()}
                aria-labelledby={headerId()}
                aria-invalid={!!inlineError2()}
                aria-describedby={inlineError2() ? errorId2() : undefined}
                onInput={(e) => {
                  setValue2(e.currentTarget.value)
                  setInlineError2("")
                }}
              />
              <Show when={inlineError2()}>
                <Box role="alert" id={errorId2()} color="$danger11" mt="$1_5" fontSize="$sm">
                  {inlineError2()}
                </Box>
              </Show>
            </div>
          </Show>
          <Show when={props.tips}>
            <FormHelperText id="modal-tips">{props.tips}</FormHelperText>
          </Show>
        </ModalBody>
        <ModalFooter display="flex" gap="$2">
          <Button onClick={currentOnClose} colorScheme="neutral">
            {t("global.cancel")}
          </Button>
          <Button
            loading={props.loading}
            onClick={() => submit()}
            disabled={!value1() || !value2()}
          >
            {t("global.ok")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
