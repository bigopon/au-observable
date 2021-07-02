import Aurelia, { bindingBehavior } from 'aurelia';
import { MyApp } from './my-app';
import { StreamAstVisitor, SubscribeAttrPattern, SubscribeCommand, SubscribeCommandInstructionRenderer } from './subscribe-command';
import { BindingInterceptor, IInterceptableBinding, BindingBehaviorExpression } from '@aurelia/runtime';
import { DebounceBindingBehavior, ThrottleBindingBehavior } from '@aurelia/runtime-html';

class SubscribeBindingBehavior extends BindingInterceptor {
  public constructor(
    binding: IInterceptableBinding,
    expr: BindingBehaviorExpression,
  ) {
    super(binding, StreamAstVisitor.rebase(expr));
  }
}
bindingBehavior('subscribe')(SubscribeBindingBehavior);

const a = { DebounceBindingBehavior, ThrottleBindingBehavior };

Aurelia
  .register(
    SubscribeAttrPattern,
    SubscribeCommand,
    SubscribeCommandInstructionRenderer,
  )
  .app(MyApp)
  .start();
