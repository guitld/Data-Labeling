use serde::Serialize;
use std::collections::HashMap;

use super::{Group, Image, TagSuggestion, ApprovedTag, TagUpvote};

#[derive(Serialize)]
pub struct AnnotationsExport<'a> {
    pub groups: &'a HashMap<String, Group>,
    pub images: &'a HashMap<String, Image>,
    pub tag_suggestions: &'a HashMap<String, TagSuggestion>,
    pub approved_tags: &'a HashMap<String, ApprovedTag>,
    pub tag_upvotes: &'a HashMap<String, TagUpvote>,
}

