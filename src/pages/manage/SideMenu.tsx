import { Box, Flex, Heading, HStack, Icon, VStack } from "@hope-ui/solid"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { useRouter, useT } from "~/hooks"
import { BiSolidRightArrow } from "solid-icons/bi"
import { onClose } from "./Header"
import { UserMethods, UserRole } from "~/types"
import { me } from "~/store"
import { AnchorWithBase } from "~/components"
import { Link } from "@solidjs/router"
import { hoverColor, joinBase } from "~/utils"
import { IconTypes } from "solid-icons"

export interface SideMenuItemProps {
  title: string
  to: string
  icon?: IconTypes
  children?: SideMenuItemProps[]
  role?: number
  external?: true
  refresh?: true
}

const SideMenuItem = (props: SideMenuItemProps) => {
  const ifShow = createMemo(() => {
    if (!UserMethods.is_admin(me())) {
      if (props.role === undefined) return false
      else if (props.role === UserRole.GENERAL && !UserMethods.is_general(me()))
        return false
    }
    return true
  })
  return (
    <Switch fallback={<SideMenuItemWithTo {...props} />}>
      <Match when={!ifShow()}>{null}</Match>
      <Match when={props.children}>
        <SideMenuItemWithChildren {...props} />
      </Match>
    </Switch>
  )
}

const SideMenuItemWithTo = (props: SideMenuItemProps) => {
  const { pathname } = useRouter()
  const t = useT()
  const isActive = () => pathname() === props.to
  return (
    <AnchorWithBase
      cancelBase={props.to.startsWith("http")}
      display="flex"
      as={Link}
      href={props.to}
      onClick={(e: any) => {
        // to(props.to!);
        onClose()
        if (props.refresh) {
          e.stopPropagation?.()
          let to = props.to
          if (!to.startsWith("http")) {
            to = joinBase(to)
          }
          window.open(to, "_self")
        }
      }}
      w="$full"
      alignItems="center"
      _hover={{
        bgColor: isActive() ? "$info4" : hoverColor(),
        textDecoration: "none",
      }}
      px="$2"
      py="$1_5"
      rounded="$md"
      cursor="pointer"
      bgColor={isActive() ? "$info4" : ""}
      color={isActive() ? "$info11" : ""}
      external={props.external}
      // _active={{ transform: "scale(.95)", transition: "0.1s" }}
    >
      <Show when={props.icon}>{<Icon mr="$2" as={props.icon} />}</Show>
      <Heading>{t(props.title)}</Heading>
    </AnchorWithBase>
  )
}

const SideMenuItemWithChildren = (props: SideMenuItemProps) => {
  const { pathname } = useRouter()
  const [open, setOpen] = createSignal(pathname().includes(props.to))
  const t = useT()
  // The translation for props.title might be complex if it's already a translated string.
  // However, the requirement is to use t(props.title) as the section name.
  // If props.title is a key like "manage.users", t(props.title) will work.
  // If props.title is already "Users", t("Users") might return "Users" or a key if it exists.
  // For simplicity, adhering to the prompt's t(props.title) for sectionName.
  const sectionName = () => t(props.title)
  return (
    <Box w="$full">
      <Flex
        justifyContent="space-between"
        onClick={() => {
          setOpen(!open())
        }}
        w="$full"
        alignItems="center"
        _hover={{
          bgColor: hoverColor(),
        }}
        px="$2"
        py="$1_5"
        rounded="$md"
        cursor="pointer"
      >
        <HStack>
          <Show when={props.icon}>{<Icon mr="$2" as={props.icon} />}</Show>
          <Heading>{t(props.title)}</Heading>
        </HStack>
        <Icon
          as={BiSolidRightArrow}
          transform={open() ? "rotate(90deg)" : "none"}
          transition="transform 0.2s"
          aria-expanded={open()}
          aria-label={open() ? t('global.collapse_section', { sectionName: sectionName() }, `Collapse ${sectionName()}`) : t('global.expand_section', { sectionName: sectionName() }, `Expand ${sectionName()}`)}
        />
      </Flex>
      <Show when={open()}>
        <Box pl="$2">
          <SideMenu items={props.children!} />
        </Box>
      </Show>
    </Box>
  )
}

export const SideMenu = (props: { items: SideMenuItemProps[] }) => {
  const t = useT()
  return (
    <VStack
      as="nav"
      aria-label={t('global.manage_sidenav', 'Management navigation')}
      p="$2"
      w="$full"
      color="$neutral11"
      spacing="$1"
    >
      <For each={props.items}>
        {(item) => {
          return <SideMenuItem {...item} />
        }}
      </For>
    </VStack>
  )
}
