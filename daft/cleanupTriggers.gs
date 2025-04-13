function cleanupAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    Logger.log(`Deleted trigger: ${trigger.getHandlerFunction()} - ${trigger.getUniqueId()}`);
  });
}
