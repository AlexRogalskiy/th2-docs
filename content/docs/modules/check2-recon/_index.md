---
repo_owner: th2-net
repo: th2-check2-recon-template
skip_readme: true
related:
  - name: "th2-net/th2-check2-recon"
    icon: "mdi-github"
    href: "https://github.com/th2-net/th2-check2-recon"
  - name: "th2-net/th2-grpc-check2-recon"
    icon: "mdi-github"
    href: "https://github.com/th2-net/th2-grpc-check2-recon"
weight: 20
---

# check2-recon

## Overview 

**сheck2-recon** is one of the th2 modules. 
The purpose of **check2-recon** is to compare several event streams. 
The module matches related messages and detects discrepancies between actual and expected messages. 
Besides direct comparison, **check2-recon** can create notes about potential inconsistencies inside the messages.

<notice info>

In the name of this module, "recon" stands for "reconciliation" rather than "reconnaissance". 
In th2, we use "recon" as a shortened term instead of "reconciliation". 

</notice>

## Family 

On GitHub the **check2-recon** module is represented by three repositories: 

- [**th2-check2-recon**](https://github.com/th2-net/th2-check2-recon) is a library that describes the main logic of the functionality as well as classes and methods behind the comparison rules.
- [**th2-check2-recon-template**](https://github.com/th2-net/th2-check2-recon-template) is a template providing sample config files with implementation of the rules and the parameters of an entry point. 
- [**th2-grpc-check2-recon**](https://github.com/th2-net/th2-grpc-check2-recon) is a repository enhancing the module with gRPC methods. 

## Configuration

To use **check2-recon**, configure it for your purposes by editing the `check2-recon.yaml` configuration file.
In particular, the adjustment is needed for the parameters for a Kubernetes Pod (the `spec/custom-config` section) and parameters describing comparison rules (the `spec/custom-config/rules` section of the config file). 

### Custom resource configuration

#### Parameters defined for the Kubernetes Pod configuration:

- `recon_name` - the name of the report in GUI.
- `cache_size` - maximum message group size. When the message group is full, a new message replaces the oldest one. An appropriate event is sent about this.
- `rules_package_path` - the path to the rules.
- `event_batch_max_size` - maximum number of events in one EventBatch.
- `event_batch_send_interval` - the frequency of sending EventBatch with events.
- `rules` - list of *rule* configurations.

#### Configuration for each rule in rules list:

- `name` - name of the file with the rule.
- `enabled` - the flag that toggles the rule usage. Set to `true` to enable.
- `match_timeout` - time interval between compared messages in seconds. The current time is taken from a new message. For all messages, that arrived earlier than (`actual_time` - `match_timeout`) and did not participate in the checks, the corresponding events will be created.
- `match_timeout_offset_ns` - the addend for `match_timeout` * 1_000_000_000, if precision to nanoseconds is needed.

Example of the Pod configuration:

```yaml
##### check2-recon.yaml #####
apiVersion: th2.exactpro.com/v1
kind: Th2Box
metadata:
  name: recon
spec:
  image-name: some_image_name
  image-version: some_image_version
  type: th2-check2-recon
  custom-config:
    recon_name: Demo_Recon
    cache_size: 5000
    event_batch_max_size: 100
    event_batch_send_interval: 1
    rules_package_path: rules
    rules:
      - name: "rule_demo_1"
        enabled: true
        match_timeout: 10
        match_timeout_offset_ns: 0
        configuration: ""
      - name: "demo_conn1_vs_demo_conn2"
        enabled: true
        match_timeout: 10
        match_timeout_offset_ns: 0
        configuration: ""
      - name: "demo_conn_vs_demo_dc"
        enabled: true
        match_timeout: 10
        match_timeout_offset_ns: 0
        configuration: ""
      - name: "log_vs_demo_conn"
        enabled: true
        match_timeout: 10
        match_timeout_offset_ns: 0
        configuration: ""
      - name: "refData_vs_demo_conn"
        enabled: true
        match_timeout: 10
        match_timeout_offset_ns: 0
        configuration: ""
```

## Rule class

In files containing the rule class Rule should be defined. Structure of class Rule is as follows.

![Rule class](./rule-class-uml.png)

Getters:

- `get_name()` - name of the rule;
- `get_description()` - description of the rule;
- `get_attributes()` - required message stream attributes;
- `desciption_of_groups()` - dictionary containing names of the groups and its type. 

Group types are available in a **check2-recon** package. At the moment there are 2 group types:

- Type `single` means that all messages in the group have unique hashes (key of the message) - a new message replaces old.
- Type `multiple` means that several messages with the same hash can be stored in one message group.

Examples of getters:

```python
##### rule_demo.py #####
def get_name(self) -> str:
       return "Rule_demo"
       
def get_description(self) -> str:
       return "Rule_demo is used for demo"
       
def get_attributes(self) -> [list]:
       return [
           ['parsed', 'subscribe']
       ]
       
 def description_of_groups(self) -> dict:
       return {'ExecutionReport': MessageGroupType.multi,
               'NewOrderSingle': MessageGroupType.single}
```

Methods `group()`, `hash()`, `check()`  in class Rule are responsible for messages processing. 
Every incoming single message comes to the `group` method, then `hash` method, then `check` method.

The lifecycle of an incoming message is:

1. Comes in rule from some kind of pin. A record about this is written to log.
2. The `group(message, attributes)` method is called for this message. It is calculated in which message group the message should be placed.
3. The hash of the message is calculated using the `hash(message, attributes)`.
4. Searches for messages with the same hash in other message groups.
5. If a message with the same hash is found in each group, `check(messages)` is called for all these messages. Depending on the types of message groups and their number, it will be determined which messages to delete and which to keep.
6. If no similar messages are found, then just add the message to the group.

![Rule flow](./rule-flow-dfd.png)

### group()

Method `group()` analyses message with an algorithm written by a user and 
sets the message's group id. Further, it will help to reveal the group the 
message belongs to. Let us say, it means that we put a message to the group 
with `group` method.

![Group method](./group-method.png)

Implementation example:

```python
##### rule_demo.py #####
def group(self, message: ReconMessage, attributes: tuple):
       message_type: str = message.proto_message.metadata.message_type
       if message_type not in ['ExecutionReport', 'NewOrderSingle']:
           return
       message.group_id = message_type
       message.group_info['message_type'] = message_type
```

### hash()

Method `hash()` generates the hash key for the message to join it in the future. 
Hash key depends on one or several fields of the message. 
The fields are defined by a user in `method` implementation. 
If all these fields are the same in 2 messages, final hash keys also will be equal.

![Hash method](./hash-method.png)

Implementation example:

```python
##### rule_demo.py #####
def hash(self, message: ReconMessage, attributes: tuple):
       cl_ord_id = message.proto_message.fields['ClOrdID'].simple_value
       message.hash = hash(message.proto_message.fields['ClOrdID'].simple_value)
       message.hash_info['ClOrdID'] = cl_ord_id
```

### check()

Method `check()` compares the message with all messages from different groups and equal hash key. 
After the comparison `check` method generates an event with its result. 
Filling of the final event is defined by the algorithm written by a user. 
After that original message is available for comparison with future messages until timeout (message's Time To Live).

![Check method](./check-method.png)

Implementation example:

```python
##### rule_demo.py #####
def check(self, messages: [ReconMessage]) -> Event:
       settings = ComparisonSettings()
       compare_result = self.message_comparator.compare(messages[0].proto_message, messages[1].proto_message, settings)
       verification_component = VerificationComponent(compare_result.comparison_result)

       info_for_name = dict()
       for message in messages:
           info_for_name.update(message.hash_info)

       body = EventUtils.create_event_body(verification_component)
       attach_ids = [msg.proto_message.metadata.id for msg in messages]
       return EventUtils.create_event(name=f"Match by '{ReconMessage.get_info(info_for_name)}'",
                                      attached_message_ids=attach_ids,
                                      attached_message_ids=attach_ids,
                                      body=body)
```

<!--auto-readme-start-->
<!--auto-readme-end-->
