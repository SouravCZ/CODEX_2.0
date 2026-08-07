import { motion } from 'framer-motion'

const VARIANTS = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14, position: 'absolute', top: 0, left: 0, right: 0 },
}

function PageTransition({ children }) {
  return (
    <motion.div
      className="overflow-x-clip"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={VARIANTS}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
