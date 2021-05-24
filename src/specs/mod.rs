mod ckb_asset;
mod sudt_asset;
pub use ckb_asset::*;
pub use sudt_asset::SudtAsset;

// use crate::Node;
// use ckb_app_config::CKBAppConfig;
// use ckb_chain_spec::ChainSpec;

pub struct Setup {
    pub num_nodes: usize,
    pub retry_failed: usize,
}

pub trait Spec: Send {
    fn name(&self) -> &str {
        spec_name(self)
    }

    fn setup(&self) -> Setup {
        Default::default()
    }

    fn before_run(&self) {
        // let mut nodes = (0..self.setup().num_nodes)
        //     .map(|i| Node::new(self.name(), &format!("node{}", i)))
        //     .collect::<Vec<_>>();
        // nodes
        //     .iter_mut()
        //     .for_each(|node| node.modify_app_config(|config| self.modify_app_config(config)));
        // nodes
        //     .iter_mut()
        //     .for_each(|node| node.modify_chain_spec(|spec| self.modify_chain_spec(spec)));
        // nodes.iter_mut().for_each(|node| node.start());
        // nodes
    }

    fn run(&self);
    // fn run(&self, nodes: &mut Vec<Node>);

    // fn modify_app_config(&self, _config: &mut CKBAppConfig) {}

    // fn modify_chain_spec(&self, _spec: &mut ChainSpec) {}
}

pub fn spec_name<T: ?Sized>(_: &T) -> &str {
    let type_name = ::std::any::type_name::<T>();
    type_name.split_terminator("::").last().unwrap()
}

impl Default for Setup {
    fn default() -> Self {
        Setup {
            num_nodes: 1,
            retry_failed: 0,
        }
    }
}

#[macro_export]
macro_rules! setup {
    ($($setup:tt)*) => {
        fn setup(&self) -> $crate::Setup{ crate::setup_internal!($($setup)*) }
    };
}

#[macro_export]
macro_rules! setup_internal {
    ($field:ident: $value:expr,) => {
        crate::setup_internal!($field: $value)
    };
    ($field:ident: $value:expr) => {
        $crate::Setup{ $field: $value, ..Default::default() }
    };
    ($field:ident: $value:expr, $($rest:tt)*) =>  {
        $crate::Setup{ $field: $value, ..crate::setup_internal!($($rest)*) }
    };
}
